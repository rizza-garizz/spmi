const prisma = require("../lib/prisma");
const { success } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const { getPagination, buildMeta } = require("../utils/listQuery");

async function index(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const where = {
    deletedAt: null,
  };

  if (req.user?.institutionId) {
    where.institutionId = req.user.institutionId;
  }

  if (req.query.status && req.user) {
    where.status = req.query.status;
  }

  if (req.query.category) {
    where.category = {
      equals: req.query.category,
      mode: "insensitive",
    };
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

  if (!req.user) {
    where.status = "aktif";
  }

  const [total, standar] = await Promise.all([
    prisma.mutuStandard.count({ where }),
    prisma.mutuStandard.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return success(
    res,
    {
      items: standar,
      meta: buildMeta(total, page, limit),
    },
    "Daftar standar mutu"
  );
}

async function store(req, res) {
  const standar = await prisma.mutuStandard.create({
    data: {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      status: req.body.status,
      institutionId: req.user.institutionId,
    },
  });

  return success(res, standar, "Standar berhasil dibuat", 201);
}

async function update(req, res) {
  const existing = await prisma.mutuStandard.findFirst({
    where: { id: req.params.id, institutionId: req.user.institutionId, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("Standar tidak ditemukan", 404);
  }

  const standar = await prisma.mutuStandard.update({
    where: { id: req.params.id },
    data: {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      status: req.body.status,
    },
  });

  return success(res, standar, "Standar berhasil diperbarui");
}

async function destroy(req, res) {
  const existing = await prisma.mutuStandard.findFirst({
    where: { id: req.params.id, institutionId: req.user.institutionId, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("Standar tidak ditemukan", 404);
  }

  await prisma.mutuStandard.update({
    where: { id: req.params.id },
    data: {
      deletedAt: new Date(),
      status: "nonaktif",
    },
  });

  return success(res, null, "Standar berhasil dihapus");
}

module.exports = {
  index,
  store,
  update,
  destroy,
};
