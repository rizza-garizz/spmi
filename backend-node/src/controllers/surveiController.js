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
    ];
  }

  const [total, surveys] = await Promise.all([
    prisma.survey.count({ where }),
    prisma.survey.findMany({
      where,
      include: {
        _count: {
          select: { responses: true },
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
      items: surveys,
      meta: buildMeta(total, page, limit),
    },
    "Daftar survei"
  );
}

async function store(req, res) {
  const survey = await prisma.survey.create({
    data: {
      title: req.body.title,
      description: req.body.description || null,
      questions: req.body.questions,
      status: req.body.status,
      startDate: req.body.start_date ? new Date(req.body.start_date) : null,
      endDate: req.body.end_date ? new Date(req.body.end_date) : null,
      createdById: req.user.id,
    },
  });

  return success(res, survey, "Survei berhasil dibuat", 201);
}

async function answer(req, res) {
  const survey = await prisma.survey.findFirst({
    where: { id: req.params.id, deletedAt: null },
  });

  if (!survey) {
    throw new AppError("Survei tidak ditemukan", 404);
  }

  if (survey.status === "ditutup") {
    throw new AppError("Survei sudah ditutup", 400);
  }

  const response = await prisma.surveyResponse.create({
    data: {
      surveyId: req.params.id,
      respondentName: req.body.respondent_name || null,
      respondentEmail: req.body.respondent_email || null,
      answers: req.body.answers,
    },
  });

  return success(res, response, "Jawaban survei berhasil dikirim", 201);
}

async function result(req, res) {
  const survey = await prisma.survey.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      responses: true,
    },
  });

  if (!survey) {
    throw new AppError("Survei tidak ditemukan", 404);
  }

  return success(
    res,
    {
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        questions: survey.questions,
        status: survey.status,
      },
      total_responden: survey.responses.length,
      jawaban: survey.responses,
    },
    "Hasil survei"
  );
}

module.exports = {
  index,
  store,
  answer,
  result,
};
