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

  if (req.query.search) {
    where.OR = [
      {
        agenda: {
          contains: req.query.search,
          mode: "insensitive",
        },
      },
      {
        decisionResults: {
          contains: req.query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  const [total, meetings] = await Promise.all([
    prisma.rtmMeeting.count({ where }),
    prisma.rtmMeeting.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return success(
    res,
    {
      items: meetings,
      meta: buildMeta(total, page, limit),
    },
    "Daftar RTM"
  );
}

async function store(req, res) {
  const meeting = await prisma.rtmMeeting.create({
    data: {
      date: new Date(req.body.tanggal),
      participants: req.body.peserta,
      agenda: req.body.agenda,
      decisionResults: req.body.hasil_keputusan,
      status: req.body.status,
    },
  });

  return success(res, meeting, "RTM berhasil dibuat", 201);
}

async function update(req, res) {
  const existing = await prisma.rtmMeeting.findFirst({
    where: { id: req.params.id, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("RTM tidak ditemukan", 404);
  }

  const meeting = await prisma.rtmMeeting.update({
    where: { id: req.params.id },
    data: {
      date: new Date(req.body.tanggal),
      participants: req.body.peserta,
      agenda: req.body.agenda,
      decisionResults: req.body.hasil_keputusan,
      status: req.body.status,
    },
  });

  return success(res, meeting, "RTM berhasil diperbarui");
}

module.exports = {
  index,
  store,
  update,
};
