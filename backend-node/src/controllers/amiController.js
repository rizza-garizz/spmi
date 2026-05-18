const prisma = require("../lib/prisma");
const { success } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const { getPagination, buildMeta } = require("../utils/listQuery");

async function index(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const where = { deletedAt: null };

  if (req.query.status) {
    where.status = req.query.status;
  }

  if (req.query.auditor_id) {
    where.auditorId = req.query.auditor_id;
  }

  if (req.query.auditee_id) {
    where.auditeeUnitId = req.query.auditee_id;
  }

  if (req.query.search) {
    where.OR = [
      {
        title: {
          contains: req.query.search,
          mode: "insensitive",
        },
      },
      {
        notes: {
          contains: req.query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  const [total, audits] = await Promise.all([
    prisma.amiAudit.count({ where }),
    prisma.amiAudit.findMany({
      where,
      include: {
        auditor: {
          select: { id: true, name: true, email: true, role: true },
        },
        auditeeUnit: true,
        findings: {
          where: { deletedAt: null },
        },
      },
      orderBy: { scheduledDate: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return success(
    res,
    {
      items: audits,
      meta: buildMeta(total, page, limit),
    },
    "Daftar siklus AMI"
  );
}

async function store(req, res) {
  const audit = await prisma.amiAudit.create({
    data: {
      title: req.body.title,
      scheduledDate: new Date(req.body.jadwal),
      auditorId: req.body.auditor_id,
      auditeeUnitId: req.body.auditee_id,
      status: req.body.status,
      notes: req.body.catatan || null,
    },
  });

  return success(res, audit, "Siklus AMI berhasil dibuat", 201);
}

async function update(req, res) {
  const existing = await prisma.amiAudit.findFirst({
    where: { id: req.params.id, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("Audit tidak ditemukan", 404);
  }

  const audit = await prisma.amiAudit.update({
    where: { id: req.params.id },
    data: {
      title: req.body.title,
      scheduledDate: new Date(req.body.jadwal),
      auditorId: req.body.auditor_id,
      auditeeUnitId: req.body.auditee_id,
      status: req.body.status,
      notes: req.body.catatan || null,
    },
  });

  return success(res, audit, "Siklus AMI berhasil diperbarui");
}

async function addFinding(req, res) {
  const audit = await prisma.amiAudit.findFirst({
    where: { id: req.params.id, deletedAt: null },
  });

  if (!audit) {
    throw new AppError("Audit tidak ditemukan", 404);
  }

  const finding = await prisma.amiFinding.create({
    data: {
      auditId: req.params.id,
      title: req.body.title,
      description: req.body.deskripsi,
      severity: req.body.severity,
      category: req.body.kategori,
      rtlPlan: req.body.rencana_tindak_lanjut || null,
      rtlStatus: req.body.status_rtl,
      dueDate: req.body.tenggat ? new Date(req.body.tenggat) : null,
    },
  });

  return success(res, finding, "Temuan audit berhasil ditambahkan", 201);
}

async function getFindings(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const where = {
    auditId: req.params.id,
    deletedAt: null,
  };

  if (req.query.severity) {
    where.severity = req.query.severity;
  }

  if (req.query.status_rtl) {
    where.rtlStatus = req.query.status_rtl;
  }

  if (req.query.search) {
    where.OR = [
      {
        title: {
          contains: req.query.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: req.query.search,
          mode: "insensitive",
        },
      },
      {
        category: {
          contains: req.query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  const [total, findings] = await Promise.all([
    prisma.amiFinding.count({ where }),
    prisma.amiFinding.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return success(
    res,
    {
      items: findings,
      meta: buildMeta(total, page, limit),
    },
    "Daftar temuan audit"
  );
}

module.exports = {
  index,
  store,
  update,
  addFinding,
  getFindings,
};
