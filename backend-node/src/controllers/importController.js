const prisma = require("../lib/prisma");
const { success } = require("../utils/apiResponse");
const AppError = require("../utils/appError");
const { readTabularFile, normalizeStandardRow } = require("../services/importService");

const allowedImportMimeTypes = new Set([
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

const allowedBulkDocumentMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

async function importStandar(req, res) {
  if (!req.file) {
    throw new AppError("File import standar wajib diunggah", 422);
  }

  if (!allowedImportMimeTypes.has(req.file.mimetype)) {
    throw new AppError("Import standar hanya mendukung CSV atau Excel", 422);
  }

  const rows = readTabularFile(req.file.path, req.file.mimetype).map(normalizeStandardRow);
  const validRows = rows.filter((row) => row.title && row.category);

  if (!validRows.length) {
    throw new AppError("Tidak ada data standar yang valid untuk diimpor", 422);
  }

  const created = await prisma.$transaction(
    validRows.map((row) =>
      prisma.mutuStandard.create({
        data: {
          ...row,
          institutionId: req.user.institutionId,
        },
      })
    )
  );

  const job = await prisma.importJob.create({
    data: {
      type: "standar",
      fileName: req.file.originalname,
      storedName: req.file.filename,
      status: "selesai",
      createdById: req.user.id,
      summary: {
        total_rows: rows.length,
        imported_rows: created.length,
      },
    },
  });

  return success(
    res,
    {
      job,
      imported: created.length,
    },
    "Import standar berhasil",
    201
  );
}

async function importDokumen(req, res) {
  if (!req.files || !req.files.length) {
    throw new AppError("Minimal satu file dokumen wajib diunggah", 422);
  }

  const invalidFile = req.files.find((file) => !allowedBulkDocumentMimeTypes.has(file.mimetype));

  if (invalidFile) {
    throw new AppError("Bulk upload dokumen hanya mendukung PDF, DOC, atau DOCX", 422);
  }

  const created = await prisma.$transaction(
    req.files.map((file) =>
      prisma.spmiDocument.create({
        data: {
          title: file.originalname.replace(/\.[^.]+$/, ""),
          description: "Bulk import dokumen",
          fileName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          uploadedById: req.user.id,
        },
      })
    )
  );

  const job = await prisma.importJob.create({
    data: {
      type: "dokumen",
      fileName: req.files[0].originalname,
      storedName: req.files[0].filename,
      status: "selesai",
      createdById: req.user.id,
      summary: {
        imported_files: created.length,
      },
    },
  });

  return success(
    res,
    {
      job,
      imported: created.length,
    },
    "Bulk upload dokumen berhasil",
    201
  );
}

module.exports = {
  importStandar,
  importDokumen,
};
