const fs = require("fs");
const prisma = require("../lib/prisma");
const { success } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const { resolveUploadedFile } = require("../utils/fileStorage");
const { getPagination, buildMeta } = require("../utils/listQuery");

const allowedDocumentMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

async function index(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const where = { deletedAt: null };

  if (req.query.standard_id) {
    where.standardId = req.query.standard_id;
  }

  if (req.query.unit_kerja_id) {
    where.orgUnitId = req.query.unit_kerja_id;
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
        fileName: {
          contains: req.query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  const [total, documents] = await Promise.all([
    prisma.spmiDocument.count({ where }),
    prisma.spmiDocument.findMany({
      where,
      include: {
        standard: true,
        orgUnit: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
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
      items: documents,
      meta: buildMeta(total, page, limit),
    },
    "Daftar dokumen"
  );
}

async function store(req, res) {
  if (!req.file) {
    throw new AppError("File dokumen wajib diunggah", 422);
  }

  if (!allowedDocumentMimeTypes.has(req.file.mimetype)) {
    throw new AppError("Dokumen hanya mendukung PDF, DOC, atau DOCX", 422);
  }

  const standardId = req.body.standard_id || null;
  const orgUnitId = req.body.unit_kerja_id || null;

  const document = await prisma.spmiDocument.create({
    data: {
      title: req.body.title,
      description: req.body.description || null,
      fileName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      standardId,
      orgUnitId,
      uploadedById: req.user.id,
    },
  });

  return success(res, document, "Dokumen berhasil diunggah", 201);
}

async function download(req, res) {
  const document = await prisma.spmiDocument.findFirst({
    where: {
      id: req.params.id,
      deletedAt: null,
    },
  });

  if (!document) {
    throw new AppError("Dokumen tidak ditemukan", 404);
  }

  const filePath = resolveUploadedFile(document.storedName);

  if (!fs.existsSync(filePath)) {
    throw new AppError("File dokumen tidak ditemukan di storage", 404);
  }

  return res.download(filePath, document.fileName);
}

module.exports = {
  index,
  store,
  download,
};
