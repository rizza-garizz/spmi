const prisma = require("../lib/prisma");
const { getDashboardSummary, getDashboardExport } = require("../services/catalogStore");
const { success } = require("../utils/apiResponse");

const PHASE_ORDER = ["P1", "P2", "E", "P3", "P4"];
const PHASE_LABELS = {
  P1: "Penetapan",
  P2: "Pelaksanaan",
  E: "Evaluasi",
  P3: "Pengendalian",
  P4: "Peningkatan",
};
const COMPLETED_STATUSES = new Set(["selesai", "ditutup"]);
const RUNNING_STATUSES = new Set(["berjalan"]);

function scoreLifecycleStatus(status) {
  if (COMPLETED_STATUSES.has(status)) return 100;
  if (RUNNING_STATUSES.has(status)) return 50;
  return 0;
}

function getStandardCategoryGroup(category = "") {
  const normalized = String(category).toLowerCase();

  if (normalized.includes("visi") || normalized.includes("tata")) return "Tata Kelola";
  if (normalized.includes("mahasiswa")) return "Mahasiswa";
  if (normalized.includes("sdm") || normalized.includes("sumber daya")) return "SDM";
  if (normalized.includes("keuangan") || normalized.includes("sarpras")) return "Keuangan & Sarpras";
  if (normalized.includes("penelitian")) return "Penelitian";
  if (normalized.includes("pengabdian") || normalized.includes("pkm")) return "PkM";
  if (normalized.includes("luaran")) return "Luaran";
  if (normalized.includes("akademik") || normalized.includes("pendidikan") || normalized.includes("pembelajaran")) {
    return "Pendidikan";
  }

  return category || "Standar Mutu";
}

function getStatusFromAchievement(achievement) {
  if (achievement >= 100) return "achieved";
  if (achievement >= 50) return "warning";
  return "risk";
}

function getPredicate(score) {
  if (score >= 361) return "UNGGUL";
  if (score >= 301) return "BAIK SEKALI";
  if (score >= 200) return "BAIK";
  return "PERLU PEMBINAAN";
}

function getPeriodLabel(date) {
  if (!date) return "-";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "-";
  const quarter = Math.floor(value.getMonth() / 3) + 1;
  return `${value.getFullYear()}-Q${quarter}`;
}

function buildPhaseHistory(cycles) {
  return PHASE_ORDER.map((phase) => {
    const phaseCycles = cycles.filter((cycle) => cycle.phase === phase);
    const value = phaseCycles.length
      ? phaseCycles.reduce((sum, cycle) => sum + scoreLifecycleStatus(cycle.status), 0) / phaseCycles.length
      : 0;

    return {
      period: PHASE_LABELS[phase],
      value: Number(value.toFixed(1)),
    };
  });
}

function getUnitNames(cycles, documents) {
  const unit = cycles.find((cycle) => cycle.orgUnit)?.orgUnit || documents.find((document) => document.orgUnit)?.orgUnit || null;
  const parent = unit?.parent || null;

  return {
    orgUnitCode: unit?.code || "",
    prodi: unit?.type === "prodi" ? unit.name : "",
    fakultas: parent?.name || (unit?.type === "fakultas" ? unit.name : ""),
  };
}

function getStandardAchievement(standard) {
  const cycles = standard.ppeppCycles || [];
  const documents = standard.documents || [];
  const phaseScores = PHASE_ORDER.map((phase) => {
    const phaseCycles = cycles.filter((cycle) => cycle.phase === phase);
    if (phaseCycles.length === 0) return 0;
    return phaseCycles.reduce((sum, cycle) => sum + scoreLifecycleStatus(cycle.status), 0) / phaseCycles.length;
  });
  const ppeppAchievement = phaseScores.reduce((sum, value) => sum + value, 0) / PHASE_ORDER.length;
  const documentAchievement = documents.length > 0 ? 100 : 0;
  const achievement = (ppeppAchievement * 0.7) + (documentAchievement * 0.3);

  return Number(achievement.toFixed(1));
}

function buildInsight(criteria) {
  if (!criteria.length) {
    return "Belum ada standar aktif di database untuk dianalisis.";
  }

  const weakest = [...criteria].sort((a, b) => a.score - b.score)[0];
  const strongest = [...criteria].sort((a, b) => b.score - a.score)[0];

  if (!weakest || !strongest) {
    return "Data kriteria belum mencukupi untuk insight otomatis.";
  }

  return `${weakest.label} menjadi prioritas karena skor database terendah (${weakest.score}/4). Kekuatan saat ini ada pada ${strongest.label} (${strongest.score}/4).`;
}

function getActivePhaseLabel(standards) {
  const cycles = standards
    .flatMap((standard) => standard.ppeppCycles || [])
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const activeCycle = cycles.find((cycle) => RUNNING_STATUSES.has(cycle.status)) || cycles[0];

  return activeCycle ? PHASE_LABELS[activeCycle.phase] || activeCycle.phase : null;
}

async function buildDashboardSummary(query = {}) {
  const yearFilter = Number(query.tahun || query.year || 0) || undefined;
  const standardFilter = String(query.standar || query.standard || "");
  const fakultasFilter = String(query.fakultas || "");
  const prodiFilter = String(query.prodi || "");

  const [
    settings,
    standards,
    orgUnits,
    documentsCount,
    rtlBerjalan,
    temuanAudit,
    activeAudits,
    activeMeetings,
    years,
    allStandardOptions,
  ] = await Promise.all([
    prisma.systemSetting.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.mutuStandard.findMany({
      where: {
        deletedAt: null,
        status: "aktif",
        ...(standardFilter ? { OR: [{ code: standardFilter }, { title: { contains: standardFilter, mode: "insensitive" } }] } : {}),
      },
      include: {
        documents: {
          where: { deletedAt: null },
          include: {
            orgUnit: { include: { parent: true } },
          },
        },
        ppeppCycles: {
          where: {
            deletedAt: null,
            ...(yearFilter ? { year: yearFilter } : {}),
            ...(prodiFilter || fakultasFilter
              ? {
                  orgUnit: {
                    OR: [
                      ...(prodiFilter ? [{ code: prodiFilter }] : []),
                      ...(fakultasFilter ? [{ code: fakultasFilter }, { parent: { code: fakultasFilter } }] : []),
                    ],
                  },
                }
              : {}),
          },
          include: {
            orgUnit: { include: { parent: true } },
          },
        },
      },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    }),
    prisma.orgUnit.findMany({
      where: { deletedAt: null },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.spmiDocument.count({ where: { deletedAt: null } }),
    prisma.amiFinding.count({
      where: {
        deletedAt: null,
        rtlStatus: { in: ["draft", "berjalan"] },
      },
    }),
    prisma.amiFinding.count({ where: { deletedAt: null } }),
    prisma.amiAudit.count({ where: { deletedAt: null, status: { in: ["terjadwal", "berjalan"] } } }),
    prisma.rtmMeeting.count({ where: { deletedAt: null, status: { in: ["draft", "berjalan"] } } }),
    prisma.ppeppCycle.findMany({
      where: { deletedAt: null },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    }),
    prisma.mutuStandard.findMany({
      where: { deletedAt: null, status: "aktif" },
      select: { id: true, code: true, title: true },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    }),
  ]);

  const scopedStandards = standards.filter((standard) => {
    if (!prodiFilter && !fakultasFilter) return true;
    return standard.ppeppCycles.length > 0 || standard.documents.some((document) => {
      const unit = document.orgUnit;
      return (
        (prodiFilter && unit?.code === prodiFilter) ||
        (fakultasFilter && (unit?.code === fakultasFilter || unit?.parent?.code === fakultasFilter))
      );
    });
  });

  const performance = scopedStandards.map((standard) => {
    const achievement = getStandardAchievement(standard);
    const { orgUnitCode, prodi, fakultas } = getUnitNames(standard.ppeppCycles, standard.documents);
    const latestCycle = [...standard.ppeppCycles].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    const latestDocument = [...standard.documents].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    const latestDate = latestCycle?.updatedAt || latestDocument?.updatedAt || standard.updatedAt;

    return {
      code: standard.code || standard.id,
      name: standard.title,
      actual: achievement,
      target: 100,
      unit: "%",
      status: getStatusFromAchievement(achievement),
      period: getPeriodLabel(latestDate),
      standard: {
        id: standard.id,
        code: standard.code || standard.id,
        title: standard.title,
        category: standard.category,
        version: standard.version,
      },
      org_unit_code: orgUnitCode,
      prodi,
      fakultas,
      achievement,
      history: buildPhaseHistory(standard.ppeppCycles),
      source: {
        ppepp_cycles: standard.ppeppCycles.length,
        documents: standard.documents.length,
      },
    };
  });

  const achievementValues = performance.map((item) => item.achievement);
  const totalIndicators = performance.length;
  const averageAchievement = totalIndicators
    ? achievementValues.reduce((sum, value) => sum + value, 0) / totalIndicators
    : 0;
  const achieved = achievementValues.filter((value) => value >= 100).length;
  const warning = achievementValues.filter((value) => value >= 50 && value < 100).length;
  const risk = achievementValues.filter((value) => value < 50).length;
  const executiveScore = Math.round(averageAchievement * 4);

  const standardAchievement = Object.values(
    performance.reduce((acc, item) => {
      const group = getStandardCategoryGroup(item.standard?.category);
      if (!acc[group]) acc[group] = { group, total: 0, sum: 0 };
      acc[group].total += 1;
      acc[group].sum += item.achievement;
      return acc;
    }, {})
  ).map((item) => ({
    group: item.group,
    total: item.total,
    achievement: item.total ? Number((item.sum / item.total).toFixed(1)) : 0,
  }));

  const criteria = standardAchievement.map((item) => ({
    label: item.group,
    score: Number(Math.min(item.achievement / 25, 4).toFixed(2)),
  }));
  const institutionName = settings?.institutionName || settings?.systemName || null;

  return {
    source: {
      type: "database",
      tables: ["MutuStandard", "SpmiDocument", "PpeppCycle", "AmiFinding", "AmiAudit", "RtmMeeting", "OrgUnit", "SystemSetting"],
    },
    institution: {
      name: institutionName,
      academic_year: settings?.academicYear || null,
      system_name: settings?.systemName || null,
    },
    metrics: [
      { label: "Standar aktif", value: standards.length, source: "MutuStandard" },
      { label: "Dokumen aktif", value: documentsCount, source: "SpmiDocument" },
      { label: "RTL berjalan", value: rtlBerjalan, source: "AmiFinding" },
      { label: "Temuan audit", value: temuanAudit, source: "AmiFinding" },
    ],
    kpi: {
      total_indicators: totalIndicators,
      average_achievement: Number(averageAchievement.toFixed(1)),
      achieved,
      warning,
      risk,
      executive_score: executiveScore,
      predicate: getPredicate(executiveScore),
    },
    accreditation: {
      score: executiveScore,
      predicate: getPredicate(executiveScore),
      criteria,
      insight: buildInsight(criteria),
    },
    cycle: {
      academic_year: settings?.academicYear || null,
      active_cycles: activeAudits + activeMeetings,
      phase: getActivePhaseLabel(scopedStandards),
      source: "SystemSetting, PpeppCycle, AmiAudit, RtmMeeting",
    },
    filters: {
      fakultas: fakultasFilter,
      prodi: prodiFilter,
      tahun: query.tahun || query.year || "",
      standar: standardFilter,
    },
    filterOptions: {
      faculties: orgUnits.filter((unit) => unit.type === "fakultas").map((unit) => ({ code: unit.code, name: unit.name })),
      studyPrograms: orgUnits.filter((unit) => unit.type === "prodi").map((unit) => ({ code: unit.code, name: unit.name })),
      standards: allStandardOptions.map((standard) => ({ code: standard.code || standard.id, title: standard.title })),
      years: years.map((item) => item.year),
    },
    standardAchievement,
    performance,
  };
}

async function summary(req, res) {
  try {
    return success(res, await buildDashboardSummary(req.query || {}), "Ringkasan dashboard");
  } catch (error) {
    const fallback = getDashboardSummary(req.query || {});
    return success(
      res,
      {
        ...fallback,
        source: {
          type: "local_operational_store",
          fallback_reason: "Database utama belum tersedia saat request dashboard.",
          tables: ["catalog.indicators", "catalog.documents", "catalog.ppeppCycles", "catalog.audits"],
        },
      },
      "Ringkasan dashboard dari fallback operasional lokal"
    );
  }
}

async function exportDashboard(req, res) {
  let payload;
  try {
    payload = await buildDashboardSummary(req.query || {});
  } catch (error) {
    const fallback = getDashboardExport(req.query?.format || "excel", req.query || {});
    res.setHeader("Content-Type", `${fallback.mime_type}; charset=utf-8`);
    res.setHeader("Content-Disposition", `attachment; filename="${fallback.file_name}"`);
    return res.send(fallback.content);
  }
  const rows = [
    ["Kode", "Indikator", "Standar", "Fakultas", "Prodi", "Periode", "Target", "Capaian", "Satuan", "Ketercapaian", "Status"],
    ...payload.performance.map((item) => [
      item.code,
      item.name,
      item.standard?.title || "",
      item.fakultas || "",
      item.prodi || "",
      item.period || "",
      item.target,
      item.actual,
      item.unit,
      `${item.achievement ?? 0}%`,
      item.status,
    ]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="dashboard-kpi-mutu.csv"');
  return res.send(csv);
}

module.exports = {
  summary,
  exportDashboard,
};
