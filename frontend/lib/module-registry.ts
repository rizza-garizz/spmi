import type { AppRole } from "@/lib/spmi-access";

export type ModuleNode = {
  id: string;
  label: string;
  shortLabel?: string;
  href: string;
  icon: string;
  description: string;
  roles: AppRole[];
  status?: "active" | "planned" | "discovery";
  children?: ModuleNode[];
};

export type ModuleSection = {
  id: string;
  label: string;
  children: ModuleNode[];
};

const allRoles: AppRole[] = ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"];
const leadershipRoles: AppRole[] = ["admin_lpm", "dekan", "wakil_dekan"];
const qualityRoles: AppRole[] = ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"];
const operatorRoles: AppRole[] = ["admin_lpm", "auditor", "kaprodi", "sekprodi", "unit_kerja"];
const adminOnly: AppRole[] = ["admin_lpm"];

const workflowChildKeywords = [
  "Dashboard",
  "Filter Eksekutif",
  "Rekap Mutu",
  "Prioritas Kerja",
  "UAT Checklist",
  "Operational Readiness",
  "Daftar",
  "Detail",
  "Monitoring",
  "Instrumen",
  "Temuan",
  "Evidence",
  "Jadwal Audit",
  "Penugasan Auditor",
  "Agenda RTM",
  "Detail RTL",
  "Repository",
  "Versi",
  "Input Capaian",
  "Ringkasan SDM",
  "Master",
  "Pegawai",
  "Dosen",
  "Tendik",
  "Struktural",
  "Sertifikasi",
  "Pelatihan",
  "SK Jabatan",
  "Standar SDM",
  "AMI",
  "Struktur Unit",
  "Status Akreditasi",
  "System Map",
  "Readiness Check",
  "Integration Logs",
  "Role Access",
  "Session Info",
  "Pembaruan",
];

const terminalActionKeywords = [
  "Export",
  "Upload",
  "Tambah",
  "Buat",
  "Jadwalkan",
  "Update",
  "Seed",
  "Commit",
  "Preview",
  "Bantuan",
];

const expandableTerminalLabels = [
  "Upload Dokumen",
  "Tambah Indikator",
];

function shouldCreateWorkflowChildren(node: ModuleNode) {
  const isGeneratedLeaf = node.id.endsWith("-overview") || node.id.endsWith("-data") || node.id.endsWith("-review");
  const isExpandableTerminal = expandableTerminalLabels.some((label) => node.label === label);
  const isTerminalAction = terminalActionKeywords.some((keyword) => node.label.includes(keyword));
  const isWorkflowArea = workflowChildKeywords.some((keyword) => node.label.includes(keyword));

  return !isGeneratedLeaf && (isExpandableTerminal || (!isTerminalAction && isWorkflowArea));
}

function createActionNode(parent: ModuleNode, suffix: string, label: string, icon: string, description: string): ModuleNode {
  const separator = parent.href.includes("#") ? "-" : "#";

  return {
    id: `${parent.id}-${suffix}`,
    label,
    href: `${parent.href}${separator}${suffix}`,
    icon,
    description,
    roles: parent.roles,
    status: parent.status ?? "active",
  };
}

function createActionNodeWithChildren(
  parent: ModuleNode,
  suffix: string,
  label: string,
  icon: string,
  description: string,
  children: Array<{ suffix: string; label: string; icon: string; description: string }>,
): ModuleNode {
  const node = createActionNode(parent, suffix, label, icon, description);

  return {
    ...node,
    children: children.map((child) => createActionNode(node, child.suffix, child.label, child.icon, child.description)),
  };
}

function createDataInputChildren(parent: ModuleNode): ModuleNode[] {
  return [
    createActionNodeWithChildren(parent, "daftar-data", "Daftar Data", "la-list", `Daftar data aktif untuk ${parent.label}.`, [
      { suffix: "pencarian", label: "Pencarian", icon: "la-search", description: `Pencarian cepat pada ${parent.label}.` },
      { suffix: "filter", label: "Filter", icon: "la-filter", description: `Filter status, unit, periode, dan kategori ${parent.label}.` },
      { suffix: "detail-data", label: "Detail Data", icon: "la-eye", description: `Detail record dan informasi pendukung ${parent.label}.` },
    ]),
    createActionNodeWithChildren(parent, "form-input", "Form Input", "la-keyboard", `Form input dan perubahan data ${parent.label}.`, [
      { suffix: "identitas", label: "Identitas", icon: "la-id-card", description: `Field identitas utama untuk ${parent.label}.` },
      { suffix: "metadata", label: "Metadata", icon: "la-tags", description: `Metadata unit, periode, pemilik, dan kategori ${parent.label}.` },
      { suffix: "lampiran", label: "Lampiran", icon: "la-paperclip", description: `Lampiran dan evidence pendukung ${parent.label}.` },
    ]),
    createActionNodeWithChildren(parent, "draft-submit", "Draft & Submit", "la-paper-plane", `Draft, submit, dan status pengiriman ${parent.label}.`, [
      { suffix: "draft", label: "Draft", icon: "la-file-alt", description: `Draft pekerjaan sebelum dikirim pada ${parent.label}.` },
      { suffix: "submit", label: "Submit", icon: "la-paper-plane", description: `Pengiriman data ${parent.label} ke proses berikutnya.` },
      { suffix: "status-pengajuan", label: "Status Pengajuan", icon: "la-tasks", description: `Status pengajuan dan tindak lanjut ${parent.label}.` },
    ]),
  ];
}

function createReviewChildren(parent: ModuleNode): ModuleNode[] {
  return [
    createActionNodeWithChildren(parent, "approval", "Approval", "la-check-circle", `Approval dan validasi berjenjang untuk ${parent.label}.`, [
      { suffix: "review", label: "Review", icon: "la-clipboard-check", description: `Review data dan kelengkapan ${parent.label}.` },
      { suffix: "keputusan", label: "Keputusan", icon: "la-check-double", description: `Keputusan setuju, revisi, atau tolak untuk ${parent.label}.` },
      { suffix: "catatan", label: "Catatan Approval", icon: "la-comment-dots", description: `Catatan approval dan arahan perbaikan ${parent.label}.` },
    ]),
    createActionNodeWithChildren(parent, "audit-trail", "Audit Trail", "la-stream", `Jejak aktivitas dan perubahan data ${parent.label}.`, [
      { suffix: "aktivitas", label: "Aktivitas", icon: "la-history", description: `Aktivitas pengguna pada ${parent.label}.` },
      { suffix: "perubahan-field", label: "Perubahan Field", icon: "la-exchange-alt", description: `Perbandingan perubahan field ${parent.label}.` },
      { suffix: "export-log", label: "Export Log", icon: "la-file-export", description: `Export log aktivitas ${parent.label}.` },
    ]),
    createActionNodeWithChildren(parent, "riwayat-versi", "Riwayat Versi", "la-code-branch", `Riwayat versi, revisi, dan catatan perubahan ${parent.label}.`, [
      { suffix: "versi-aktif", label: "Versi Aktif", icon: "la-check", description: `Versi aktif yang sedang digunakan pada ${parent.label}.` },
      { suffix: "revisi", label: "Revisi", icon: "la-pen", description: `Daftar revisi dan perubahan ${parent.label}.` },
      { suffix: "perbandingan", label: "Perbandingan", icon: "la-columns", description: `Perbandingan antar versi ${parent.label}.` },
    ]),
  ];
}

function createWorkflowChildren(node: ModuleNode): ModuleNode[] {
  const separator = node.href.includes("#") ? "-" : "#";
  const dataNode: ModuleNode = {
    id: `${node.id}-data`,
    label: "Data & Input",
    href: `${node.href}${separator}data-input`,
    icon: "la-edit",
    description: `Area input, pembaruan data, dan aktivitas utama ${node.label}.`,
    roles: node.roles,
    status: node.status ?? "active",
  };
  const reviewNode: ModuleNode = {
    id: `${node.id}-review`,
    label: "Validasi & Riwayat",
    href: `${node.href}${separator}validasi-riwayat`,
    icon: "la-history",
    description: `Validasi, approval, audit trail, dan riwayat perubahan ${node.label}.`,
    roles: node.roles,
    status: node.status ?? "active",
  };

  return [
    {
      id: `${node.id}-overview`,
      label: "Ringkasan",
      href: `${node.href}${separator}ringkasan`,
      icon: "la-info-circle",
      description: `Ringkasan konteks, status, dan prioritas untuk ${node.label}.`,
      roles: node.roles,
      status: node.status ?? "active",
    },
    {
      ...dataNode,
      children: createDataInputChildren(dataNode),
    },
    {
      ...reviewNode,
      children: createReviewChildren(reviewNode),
    },
  ];
}

function normalizeModuleNode(node: ModuleNode): ModuleNode {
  const generatedChildren = shouldCreateWorkflowChildren(node) ? createWorkflowChildren(node) : undefined;
  const children = node.children?.length ? node.children.map((child) => normalizeModuleNode(child)) : generatedChildren;

  return {
    ...node,
    ...(children ? { children } : {}),
  };
}

const rawModuleRegistry: ModuleSection[] = [
  {
    id: "strategic-dashboard",
    label: "Strategic Dashboard",
    children: [
      {
        id: "dashboard",
        label: "Performance Overview",
        shortLabel: "Dashboard",
        href: "/dashboard",
        icon: "la-dashboard",
        description: "Ringkasan eksekutif mutu dan performa universitas.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "dashboard-kpi",
            label: "Dashboard KPI Mutu",
            href: "/dashboard#kpi-mutu",
            icon: "la-tachometer-alt",
            description: "Kartu KPI, grafik ketercapaian, dan monitoring indikator.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "dashboard-filter",
            label: "Filter Eksekutif",
            href: "/dashboard#filter-eksekutif",
            icon: "la-filter",
            description: "Filter fakultas, prodi, tahun, dan standar.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "dashboard-export",
            label: "Export KPI",
            href: "/dashboard#export-kpi",
            icon: "la-file-export",
            description: "Export dashboard ke Excel atau PDF.",
            roles: leadershipRoles,
            status: "active",
          },
        ],
      },
      {
        id: "nilai",
        label: "Nilai & Rekap",
        href: "/nilai",
        icon: "la-bar-chart",
        description: "Rekap capaian, skor, dan ringkasan evaluasi mutu.",
        roles: operatorRoles,
        status: "active",
        children: [
          {
            id: "nilai-rekap",
            label: "Rekap Mutu",
            href: "/nilai#rekap-mutu",
            icon: "la-clipboard-list",
            description: "Ringkasan nilai dan status evaluasi.",
            roles: operatorRoles,
            status: "active",
          },
          {
            id: "nilai-prioritas",
            label: "Prioritas Kerja",
            href: "/nilai#prioritas-kerja",
            icon: "la-bullseye",
            description: "Area prioritas untuk tindak lanjut mutu.",
            roles: operatorRoles,
            status: "active",
          },
        ],
      },
      {
        id: "go-live",
        label: "Go-Live Readiness",
        shortLabel: "Go-Live",
        href: "/go-live",
        icon: "la-rocket",
        description: "UAT, backup, monitoring, dan kesiapan pilot sistem.",
        roles: leadershipRoles,
        status: "active",
        children: [
          {
            id: "go-live-uat",
            label: "UAT Checklist",
            href: "/go-live#uat-checklist",
            icon: "la-check-square",
            description: "Checklist UAT LPM, Prodi, Auditor, Unit, dan Pimpinan.",
            roles: leadershipRoles,
            status: "active",
          },
          {
            id: "go-live-ops",
            label: "Operational Readiness",
            href: "/go-live#operational-readiness",
            icon: "la-server",
            description: "Backup database, storage dokumen, dan monitoring server.",
            roles: leadershipRoles,
            status: "active",
          },
        ],
      },
    ],
  },
  {
    id: "penetapan",
    label: "P - Penetapan (Policies)",
    children: [
      {
        id: "standards",
        label: "Standar Mutu (IQAS)",
        shortLabel: "Standar Mutu",
        href: "/standards",
        icon: "la-book",
        description: "Master standar pendidikan, penelitian, PkM, dan standar tambahan.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "standards-list",
            label: "Daftar Standar",
            href: "/standards#daftar-standar",
            icon: "la-list",
            description: "Tabel standar, pencarian, filter, versi, dan revisi.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "standards-create",
            label: "Tambah Standar",
            href: "/standards#tambah-standar",
            icon: "la-plus-circle",
            description: "Tambah standar dengan penomoran otomatis.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "standards-export",
            label: "Export Standar",
            href: "/standards#export-standar",
            icon: "la-file-excel",
            description: "Export daftar standar dan riwayatnya.",
            roles: allRoles,
            status: "active",
          },
        ],
      },
      {
        id: "documents",
        label: "Document Repository",
        shortLabel: "Dokumen SPMI",
        href: "/documents",
        icon: "la-file-text",
        description: "Repository kebijakan, pedoman, standar, dan eviden PPEPP.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "documents-repository",
            label: "Daftar Repository",
            href: "/documents#repository",
            icon: "la-folder-open",
            description: "Pencarian, filter, preview, dan unduh dokumen.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "documents-upload",
            label: "Upload Dokumen",
            href: "/documents#upload-dokumen",
            icon: "la-upload",
            description: "Unggah dokumen baru dengan validasi metadata.",
            roles: operatorRoles,
            status: "active",
          },
          {
            id: "documents-versioning",
            label: "Versi Dokumen",
            href: "/documents#versi-dokumen",
            icon: "la-code-branch",
            description: "Kelola versi dan validasi file duplikat.",
            roles: operatorRoles,
            status: "active",
          },
        ],
      },
    ],
  },
  {
    id: "pelaksanaan",
    label: "P - Pelaksanaan (Action)",
    children: [
      {
        id: "indicators",
        label: "Capaian IKU/IKT",
        shortLabel: "Indikator",
        href: "/indicators",
        icon: "la-chart-line",
        description: "Indikator kinerja utama, target, capaian, dan sumber data.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "indicators-list",
            label: "Daftar Indikator",
            href: "/indicators#daftar-indikator",
            icon: "la-list",
            description: "Pencarian, filter, dan pagination indikator.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "indicators-create",
            label: "Tambah Indikator",
            href: "/indicators#tambah-indikator",
            icon: "la-plus-circle",
            description: "Tambah IKU/IKT dengan standar dan unit pemilik.",
            roles: operatorRoles,
            status: "active",
          },
          {
            id: "indicators-values",
            label: "Input Capaian",
            href: "/indicators#input-capaian",
            icon: "la-keyboard",
            description: "Input nilai capaian dan analisis akar masalah.",
            roles: operatorRoles,
            status: "active",
          },
        ],
      },
      {
        id: "ppepp",
        label: "PPEPP Tracker",
        href: "/ppepp",
        icon: "la-refresh",
        description: "Siklus penetapan, pelaksanaan, evaluasi, pengendalian, dan peningkatan.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "ppepp-cycles",
            label: "Daftar Siklus",
            href: "/ppepp#daftar-siklus",
            icon: "la-sync",
            description: "Monitoring siklus PPEPP lintas unit.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "ppepp-create",
            label: "Buat Siklus",
            href: "/ppepp#buat-siklus",
            icon: "la-plus-circle",
            description: "Membuat siklus PPEPP berdasarkan unit dan tahun akademik.",
            roles: operatorRoles,
            status: "active",
          },
          {
            id: "ppepp-evidence",
            label: "Evidence PPEPP",
            href: "/ppepp#evidence-ppepp",
            icon: "la-paperclip",
            description: "Upload bukti setiap tahap PPEPP.",
            roles: operatorRoles,
            status: "active",
          },
        ],
      },
    ],
  },
  {
    id: "evaluasi",
    label: "E - Evaluasi (Evaluation)",
    children: [
      {
        id: "ami",
        label: "Audit Mutu Internal",
        shortLabel: "AMI",
        href: "/ami",
        icon: "la-check-circle",
        description: "Audit, temuan, rekomendasi, dan status tindak lanjut.",
        roles: qualityRoles,
        status: "active",
        children: [
          {
            id: "ami-schedule",
            label: "Jadwal Audit",
            href: "/ami#jadwal-audit",
            icon: "la-calendar-check",
            description: "Penjadwalan audit dan unit auditee.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "ami-assignment",
            label: "Penugasan Auditor",
            href: "/ami#penugasan-auditor",
            icon: "la-user-check",
            description: "Kelola auditor, jadwal, dan status assignment.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "ami-instrument",
            label: "Instrumen Audit",
            href: "/ami#instrumen-audit",
            icon: "la-tasks",
            description: "Checklist instrumen, skor, dan catatan audit.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "ami-findings",
            label: "Temuan & Verifikasi",
            href: "/ami#temuan-verifikasi",
            icon: "la-search-plus",
            description: "Temuan minor/mayor/observasi, tindak lanjut, dan verifikasi.",
            roles: qualityRoles,
            status: "active",
          },
        ],
      },
      {
        id: "surveys",
        label: "Stakeholder Feedback",
        shortLabel: "Survei",
        href: "/surveys",
        icon: "la-poll",
        description: "Survei pemangku kepentingan untuk input evaluasi mutu.",
        roles: qualityRoles,
        status: "active",
        children: [
          {
            id: "surveys-list",
            label: "Daftar Survei",
            href: "/surveys#daftar-survei",
            icon: "la-list",
            description: "Survei aktif, target responden, dan status.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "surveys-create",
            label: "Buat Survei",
            href: "/surveys#buat-survei",
            icon: "la-plus-circle",
            description: "Membuat survei dengan target dan siklus PPEPP.",
            roles: qualityRoles,
            status: "active",
          },
        ],
      },
    ],
  },
  {
    id: "pengendalian",
    label: "P - Pengendalian (Control)",
    children: [
      {
        id: "rtm",
        label: "Mgt Review (RTM)",
        shortLabel: "RTM",
        href: "/rtm",
        icon: "la-users",
        description: "Rapat tinjauan manajemen dan pengambilan keputusan strategis.",
        roles: qualityRoles,
        status: "active",
        children: [
          {
            id: "rtm-agenda",
            label: "Agenda RTM",
            href: "/rtm#agenda-rtm",
            icon: "la-calendar",
            description: "Daftar rapat, status, dan keputusan RTM.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "rtm-create",
            label: "Jadwalkan RTM",
            href: "/rtm#jadwalkan-rtm",
            icon: "la-plus-circle",
            description: "Membuat agenda RTM baru berbasis siklus dan unit.",
            roles: leadershipRoles,
            status: "active",
          },
          {
            id: "rtm-rtl-detail",
            label: "Detail RTL",
            href: "/rtm#detail-rtl",
            icon: "la-eye",
            description: "Melihat tindak lanjut dari keputusan RTM.",
            roles: qualityRoles,
            status: "active",
          },
        ],
      },
      {
        id: "rtl",
        label: "RTL Monitoring",
        shortLabel: "RTL",
        href: "/rtl",
        icon: "la-tasks",
        description: "Monitoring penugasan dan progres tindak lanjut per unit.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "rtl-monitoring",
            label: "Monitoring RTL",
            href: "/rtl#monitoring-rtl",
            icon: "la-clipboard-check",
            description: "Daftar tindak lanjut, status, PIC, dan deadline.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "rtl-progress",
            label: "Update Progress",
            href: "/rtl#update-progress",
            icon: "la-edit",
            description: "Memperbarui progres, catatan, dan status tindak lanjut.",
            roles: operatorRoles,
            status: "active",
          },
        ],
      },
    ],
  },
  {
    id: "integrasi",
    label: "Pengaturan & Integrasi",
    children: [
      {
        id: "hris",
        label: "HRIS / SDM",
        shortLabel: "HRIS",
        href: "/hris",
        icon: "la-id-card",
        description: "Sumber data SDM untuk SPMI, AMI, dan akreditasi.",
        roles: leadershipRoles,
        status: "active",
        children: [
          {
            id: "hris-overview",
            label: "Ringkasan SDM",
            href: "/hris",
            icon: "la-chart-pie",
            description: "Dashboard SDM dan koneksi mutu.",
            roles: leadershipRoles,
            status: "active",
          },
          {
            id: "hris-master-sdm",
            label: "Master SDM",
            href: "/hris/master-sdm",
            icon: "la-users",
            description: "Pegawai, dosen, tendik, dan tugas tambahan.",
            roles: leadershipRoles,
            status: "active",
            children: [
              {
                id: "hris-master-pegawai",
                label: "Master Pegawai",
                href: "/hris/master-sdm/pegawai",
                icon: "la-user",
                description: "Data induk seluruh pegawai.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-dosen",
                label: "Dosen",
                href: "/hris/master-sdm/dosen",
                icon: "la-chalkboard-teacher",
                description: "Dosen aktif dan status akademiknya.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-tendik",
                label: "Tendik",
                href: "/hris/master-sdm/tendik",
                icon: "la-user-cog",
                description: "Tenaga kependidikan dan unit homebase.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-dosen-tugas-tambahan",
                label: "Dosen Tugas Tambahan",
                href: "/hris/master-sdm/dosen-tugas-tambahan",
                icon: "la-user-plus",
                description: "Dosen dengan jabatan atau penugasan tambahan.",
                roles: leadershipRoles,
                status: "active",
              },
            ],
          },
          {
            id: "hris-jabatan",
            label: "Jabatan",
            href: "/hris/jabatan",
            icon: "la-user-shield",
            description: "Struktur jabatan dan penugasan aktif.",
            roles: leadershipRoles,
            status: "active",
            children: [
              {
                id: "hris-jabatan-struktural",
                label: "Struktural",
                href: "/hris/jabatan/struktural",
                icon: "la-sitemap",
                description: "Jabatan struktural fakultas, prodi, dan unit.",
                roles: leadershipRoles,
                status: "active",
              },
            ],
          },
          {
            id: "hris-kompetensi",
            label: "Kompetensi",
            href: "/hris/kompetensi",
            icon: "la-certificate",
            description: "Sertifikasi, pelatihan, dan kompetensi SDM.",
            roles: leadershipRoles,
            status: "active",
            children: [
              {
                id: "hris-sertifikasi",
                label: "Sertifikasi",
                href: "/hris/kompetensi/sertifikasi",
                icon: "la-award",
                description: "Sertifikasi pendidik dan sertifikat profesional.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-pelatihan",
                label: "Pelatihan",
                href: "/hris/kompetensi/pelatihan",
                icon: "la-graduation-cap",
                description: "Riwayat pelatihan, workshop, dan pengembangan SDM.",
                roles: leadershipRoles,
                status: "active",
              },
            ],
          },
          {
            id: "hris-dokumen",
            label: "Dokumen SDM",
            href: "/hris/dokumen",
            icon: "la-folder-open",
            description: "SK, sertifikat, dan eviden SDM.",
            roles: leadershipRoles,
            status: "active",
            children: [
              {
                id: "hris-sk-jabatan",
                label: "SK Jabatan",
                href: "/hris/dokumen/sk-jabatan",
                icon: "la-file-signature",
                description: "Surat keputusan jabatan dan pengangkatan.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-dokumen-sertifikat",
                label: "Sertifikat",
                href: "/hris/dokumen/sertifikat",
                icon: "la-certificate",
                description: "Sertifikat pendidik dan kompetensi.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-upload-eviden",
                label: "Upload Eviden",
                href: "/hris/dokumen/upload",
                icon: "la-upload",
                description: "Unggah dokumen pendukung data SDM.",
                roles: leadershipRoles,
                status: "active",
              },
            ],
          },
          {
            id: "hris-integrasi-spmi",
            label: "Koneksi SPMI",
            href: "/hris/integrasi-spmi",
            icon: "la-link",
            description: "Pemetaan data HRIS ke standar, AMI, dan akreditasi.",
            roles: leadershipRoles,
            status: "active",
            children: [
              {
                id: "hris-standar-sdm",
                label: "Standar SDM",
                href: "/hris/integrasi-spmi/standar-sdm",
                icon: "la-book",
                description: "Koneksi data SDM ke standar mutu.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-ami-akreditasi",
                label: "AMI & Akreditasi",
                href: "/hris/integrasi-spmi/ami-akreditasi",
                icon: "la-check-double",
                description: "Eviden SDM untuk AMI dan akreditasi.",
                roles: leadershipRoles,
                status: "active",
              },
            ],
          },
        ],
      },
      {
        id: "organization",
        label: "Organization",
        shortLabel: "Organisasi",
        href: "/organization",
        icon: "la-sitemap",
        description: "Unit organisasi, fakultas, program studi, dan struktur.",
        roles: leadershipRoles,
        status: "active",
        children: [
          {
            id: "organization-tree",
            label: "Struktur Unit",
            href: "/organization#struktur-unit",
            icon: "la-sitemap",
            description: "Parent-child unit, fakultas, prodi, dan unit pendukung.",
            roles: leadershipRoles,
            status: "active",
          },
          {
            id: "organization-export",
            label: "Export Organisasi",
            href: "/organization#export-organisasi",
            icon: "la-file-export",
            description: "Export struktur unit dan kode integrasi.",
            roles: leadershipRoles,
            status: "active",
          },
        ],
      },
      {
        id: "accreditation",
        label: "Accreditation",
        shortLabel: "Akreditasi",
        href: "/accreditation",
        icon: "la-graduation-cap",
        description: "Kriteria, dokumen, dan kesiapan akreditasi.",
        roles: qualityRoles,
        status: "active",
        children: [
          {
            id: "accreditation-status",
            label: "Status Akreditasi",
            href: "/accreditation#status-akreditasi",
            icon: "la-award",
            description: "Status, peringkat, masa berlaku, dan instrumen.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "accreditation-certificate",
            label: "Sertifikat Akreditasi",
            href: "/accreditation#sertifikat-akreditasi",
            icon: "la-file-certificate",
            description: "Akses dokumen sertifikat akreditasi unit.",
            roles: qualityRoles,
            status: "active",
          },
        ],
      },
      {
        id: "imports",
        label: "Imports",
        href: "/imports",
        icon: "la-upload",
        description: "Import LKPT, LKPS, KKM, dan migrasi AOA.",
        roles: adminOnly,
        status: "active",
        children: [
          {
            id: "imports-upload",
            label: "Upload Import",
            href: "/imports#upload-import",
            icon: "la-upload",
            description: "Upload file LKPT, LKPS, KKM, atau dataset pendukung.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "imports-aoa-preview",
            label: "AOA Preview",
            href: "/imports#aoa-preview",
            icon: "la-eye",
            description: "Preview validasi data sebelum commit migrasi.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "imports-aoa-commit",
            label: "AOA Commit",
            href: "/imports#aoa-commit",
            icon: "la-check-circle",
            description: "Commit data import yang sudah valid.",
            roles: adminOnly,
            status: "active",
          },
        ],
      },
      {
        id: "integrations",
        label: "Integrations",
        shortLabel: "Integrasi",
        href: "/integrations",
        icon: "la-plug",
        description: "Daftar integrasi sistem pendukung SPMI.",
        roles: adminOnly,
        status: "active",
        children: [
          {
            id: "integrations-map",
            label: "System Map",
            href: "/integrations#system-map",
            icon: "la-project-diagram",
            description: "Peta koneksi SIAKAD, SIMPEG, Keuangan, Repository, PDDIKTI, dan SSO.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "integrations-check",
            label: "Readiness Check",
            href: "/integrations#readiness-check",
            icon: "la-heartbeat",
            description: "Cek sinkronisasi, duplicate data, dan error API.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "integrations-log",
            label: "Integration Logs",
            href: "/integrations#integration-logs",
            icon: "la-history",
            description: "Log integrasi dan riwayat sinkronisasi.",
            roles: adminOnly,
            status: "active",
          },
        ],
      },
      {
        id: "settings",
        label: "Akses & Settings",
        shortLabel: "Settings",
        href: "/settings",
        icon: "la-cog",
        description: "Pengaturan akses, role, dan konfigurasi sistem.",
        roles: adminOnly,
        status: "active",
        children: [
          {
            id: "settings-role-access",
            label: "Role Access",
            href: "/settings#role-access",
            icon: "la-user-lock",
            description: "Mapping role, kewenangan menu, dan scope unit.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "settings-seed-user",
            label: "Seed Users",
            href: "/settings#seed-users",
            icon: "la-users-cog",
            description: "Daftar user awal dan role aktif.",
            roles: adminOnly,
            status: "active",
          },
        ],
      },
      {
        id: "access-info",
        label: "Access Info",
        href: "/access-info",
        icon: "la-info-circle",
        description: "Informasi akses role, sesi, dan bantuan akun.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "access-session",
            label: "Session Info",
            href: "/access-info#session-info",
            icon: "la-user-clock",
            description: "Informasi sesi dan role pengguna aktif.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "access-help",
            label: "Bantuan Akses",
            href: "/access-info#bantuan-akses",
            icon: "la-life-ring",
            description: "Bantuan reset akses dan kontak admin mutu.",
            roles: allRoles,
            status: "active",
          },
        ],
      },
      {
        id: "news",
        label: "Berita & Aktivitas",
        href: "/news",
        icon: "la-newspaper",
        description: "Informasi terbaru, kegiatan, dan pembaruan SPMI.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "news-updates",
            label: "Pembaruan Sistem",
            href: "/news#pembaruan-sistem",
            icon: "la-bell",
            description: "Update fitur, kegiatan mutu, dan pengumuman.",
            roles: allRoles,
            status: "active",
          },
        ],
      },
    ],
  },
];

const normalizedSourceSections: ModuleSection[] = rawModuleRegistry.map((section) => ({
  ...section,
  children: section.children.map((node) => normalizeModuleNode(node)),
}));

function findSourceNode(id: string) {
  const source = normalizedSourceSections.flatMap((section) => section.children).find((node) => node.id === id);
  if (!source) {
    throw new Error(`Module node ${id} tidak ditemukan di registry sumber.`);
  }

  return source;
}

function createProcessNode(id: string, label: string, href: string, icon: string, description: string, roles: AppRole[], children: ModuleNode[] = []): ModuleNode {
  return {
    id,
    label,
    href,
    icon,
    description,
    roles,
    status: "active",
    ...(children.length > 0 ? { children } : {}),
  };
}

export const businessProcessFlow = [
  {
    step: "01",
    label: "Master Data & Sumber Data",
    href: "/modules/master-data",
    description: "Validasi struktur kampus, SDM, periode, role, dan sumber data sebelum proses mutu dimulai.",
  },
  {
    step: "02",
    label: "Penetapan Standar",
    href: "/modules/penetapan-standar",
    description: "Tetapkan standar mutu, dokumen kebijakan, versi, dan metadata resmi.",
  },
  {
    step: "03",
    label: "Pelaksanaan & Capaian",
    href: "/modules/pelaksanaan-capaian",
    description: "Jalankan PPEPP dan input capaian indikator yang melekat pada standar.",
  },
  {
    step: "04",
    label: "Evaluasi Mutu",
    href: "/modules/evaluasi-mutu",
    description: "Lakukan AMI, survei, pengukuran, dan temuan berbasis evidence.",
  },
  {
    step: "05",
    label: "Pengendalian",
    href: "/modules/pengendalian-rtl",
    description: "Kelola RTL, verifikasi perbaikan, dan RTM sebagai pengendalian manajemen.",
  },
  {
    step: "06",
    label: "Peningkatan",
    href: "/modules/peningkatan-mutu",
    description: "Tutup siklus melalui revisi standar, program perbaikan, dan prioritas peningkatan.",
  },
  {
    step: "07",
    label: "Monitoring & Pelaporan",
    href: "/modules/monitoring-pelaporan",
    description: "Pimpinan memantau KPI, laporan AMI, kesiapan akreditasi, dan go-live readiness.",
  },
  {
    step: "08",
    label: "Administrasi Sistem",
    href: "/modules/administrasi-sistem",
    description: "Kelola integrasi, import, setting, akses, dan pengumuman sistem.",
  },
];

export const moduleSectionDescriptions: Record<string, string> = Object.fromEntries(
  businessProcessFlow.map((item) => [item.href.replace("/modules/", ""), item.description])
);

const peningkatanMutuNode = createProcessNode(
  "improvement",
  "Peningkatan Mutu",
  "/nilai",
  "la-level-up-alt",
  "Prioritas peningkatan, revisi standar, dan tindak lanjut siklus berikutnya.",
  allRoles,
  [
    createProcessNode(
      "improvement-prioritas",
      "Prioritas Peningkatan",
      "/nilai#prioritas-kerja",
      "la-bullseye",
      "Daftar isu prioritas dari hasil evaluasi, AMI, dan RTM.",
      allRoles
    ),
    createProcessNode(
      "improvement-revisi-standar",
      "Revisi Standar",
      "/standards#daftar-standar-validasi-riwayat-riwayat-versi-revisi",
      "la-code-branch",
      "Revisi standar berdasarkan hasil pengendalian dan peningkatan.",
      adminOnly
    ),
    createProcessNode(
      "improvement-siklus-baru",
      "Siklus PPEPP Berikutnya",
      "/ppepp#buat-siklus",
      "la-sync",
      "Buka siklus baru setelah peningkatan disetujui.",
      operatorRoles
    ),
  ]
);

export const moduleRegistry: ModuleSection[] = [
  {
    id: "master-data",
    label: "01 Master Data & Sumber Data",
    children: [
      findSourceNode("organization"),
      findSourceNode("hris"),
      findSourceNode("access-info"),
    ],
  },
  {
    id: "penetapan-standar",
    label: "02 Penetapan Standar",
    children: [
      findSourceNode("standards"),
      findSourceNode("documents"),
    ],
  },
  {
    id: "pelaksanaan-capaian",
    label: "03 Pelaksanaan & Capaian",
    children: [
      findSourceNode("indicators"),
      findSourceNode("ppepp"),
    ],
  },
  {
    id: "evaluasi-mutu",
    label: "04 Evaluasi Mutu",
    children: [
      findSourceNode("ami"),
      findSourceNode("surveys"),
    ],
  },
  {
    id: "pengendalian-rtl",
    label: "05 Pengendalian RTL & RTM",
    children: [
      findSourceNode("rtl"),
      findSourceNode("rtm"),
    ],
  },
  {
    id: "peningkatan-mutu",
    label: "06 Peningkatan Mutu",
    children: [
      peningkatanMutuNode,
      findSourceNode("nilai"),
    ],
  },
  {
    id: "monitoring-pelaporan",
    label: "07 Monitoring & Pelaporan",
    children: [
      findSourceNode("dashboard"),
      findSourceNode("accreditation"),
      findSourceNode("go-live"),
      findSourceNode("news"),
    ],
  },
  {
    id: "administrasi-sistem",
    label: "08 Administrasi Sistem",
    children: [
      findSourceNode("integrations"),
      findSourceNode("imports"),
      findSourceNode("settings"),
    ],
  },
];

export function flattenModuleNodes(nodes: ModuleNode[]): ModuleNode[] {
  return nodes.flatMap((node) => [node, ...flattenModuleNodes(node.children ?? [])]);
}

export function getAllModuleNodes() {
  return moduleRegistry.flatMap((section) => flattenModuleNodes(section.children));
}

export function findModuleNodeByHref(href: string) {
  return getAllModuleNodes().find((node) => node.href === href);
}

export function findModuleTrail(pathname: string) {
  const trail: ModuleNode[] = [];

  function visit(nodes: ModuleNode[], parents: ModuleNode[]) {
    for (const node of nodes) {
      const currentTrail = [...parents, node];
      if (pathname === node.href) {
        trail.splice(0, trail.length, ...currentTrail);
      }
      visit(node.children ?? [], currentTrail);
    }
  }

  moduleRegistry.forEach((section) => visit(section.children, []));

  if (trail.length > 0) {
    return trail;
  }

  const fallback = getAllModuleNodes()
    .filter((node) => pathname.startsWith(`${node.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return fallback ? [fallback] : [];
}
