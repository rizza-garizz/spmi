const prisma = require("../lib/prisma");
const { success } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const { getPagination, buildMeta } = require("../utils/listQuery");

async function index(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const where = { deletedAt: null };

  if (req.query.standar_id) {
    where.standardId = req.query.standar_id;
  }

  if (req.query.unit_kerja_id) {
    where.orgUnitId = req.query.unit_kerja_id;
  }

  if (req.query.fase) {
    where.phase = req.query.fase;
  }

  if (req.query.status) {
    where.status = req.query.status;
  }

  if (req.query.tahun) {
    where.year = Number(req.query.tahun);
  }

  const [total, entries] = await Promise.all([
    prisma.ppeppCycle.count({ where }),
    prisma.ppeppCycle.findMany({
      where,
      include: {
        standard: true,
        orgUnit: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return success(
    res,
    {
      items: entries,
      meta: buildMeta(total, page, limit),
    },
    "Daftar siklus PPEPP"
  );
}

async function store(req, res) {
  const entry = await prisma.ppeppCycle.create({
    data: {
      standardId: req.body.standar_id,
      orgUnitId: req.body.unit_kerja_id,
      phase: req.body.fase,
      content: req.body.isi,
      status: req.body.status,
      year: req.body.tahun,
      createdById: req.user.id,
    },
  });

  return success(res, entry, "Siklus PPEPP berhasil dibuat", 201);
}

async function update(req, res) {
  const existing = await prisma.ppeppCycle.findFirst({
    where: { id: req.params.id, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("Data PPEPP tidak ditemukan", 404);
  }

  const entry = await prisma.ppeppCycle.update({
    where: { id: req.params.id },
    data: {
      standardId: req.body.standar_id,
      orgUnitId: req.body.unit_kerja_id,
      phase: req.body.fase,
      content: req.body.isi,
      status: req.body.status,
      year: req.body.tahun,
    },
  });

  return success(res, entry, "Siklus PPEPP berhasil diperbarui");
}

module.exports = {
  index,
  store,
  update,
};
