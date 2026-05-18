const prisma = require("../lib/prisma");
const env = require("../config/env");
const AppError = require("../utils/appError");
const { readTabularFile } = require("./importService");
const { state, addImport } = require("./catalogStore");

const allowedMigrationMimeTypes = new Set([
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeStatus(value) {
  return normalizeText(value).toLowerCase() === "nonaktif" ? "nonaktif" : "aktif";
}

function buildStandardKey({ title, category }) {
  return `${normalizeText(title).toLowerCase()}::${normalizeText(category).toLowerCase()}`;
}

function normalizeAoaStandardRow(row, index) {
  const title = normalizeText(row.judul || row.title || row.nama || row.standard_title);
  const category = normalizeText(row.kategori || row.category || row.kelompok || row.standard_category);
  const description = normalizeText(row.deskripsi || row.description || row.keterangan);
  const code = normalizeText(row.kode || row.code || row.standard_code);
  const status = normalizeStatus(row.status);
  const issues = [];

  if (!title) {
    issues.push("Judul standar wajib diisi.");
  }

  if (!category) {
    issues.push("Kategori standar wajib diisi.");
  }

  return {
    row_number: index + 2,
    raw: row,
    normalized: {
      code,
      title,
      category,
      description,
      status,
    },
    issues,
  };
}

async function getExistingStandards() {
  if (env.appMode === "local_mock") {
    return state.standards.map((item) => ({
      id: item.id,
      code: item.code || "",
      title: item.title,
      category: item.category,
      description: item.description || "",
      status: item.status || "aktif",
    }));
  }

  return prisma.mutuStandard.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function parseAoaMigration(file, entity = "standards") {
  if (!file) {
    throw new AppError("File migrasi AOA wajib diunggah.", 422);
  }

  if (!allowedMigrationMimeTypes.has(file.mimetype)) {
    throw new AppError("Migrasi AOA hanya mendukung CSV atau Excel.", 422);
  }

  if (entity !== "standards") {
    throw new AppError("Target migrasi AOA yang saat ini didukung hanya standards.", 422);
  }

  const rows = readTabularFile(file.path, file.mimetype);
  const existing = await getExistingStandards();
  const existingMap = new Map(existing.map((item) => [buildStandardKey(item), item]));
  const seenKeys = new Set();

  const previewRows = rows.map((row, index) => {
    const normalized = normalizeAoaStandardRow(row, index);
    const key = buildStandardKey(normalized.normalized);
    const issues = [...normalized.issues];
    const duplicateInSystem = existingMap.has(key);
    const duplicateInFile = seenKeys.has(key);

    if (!issues.length) {
      if (duplicateInSystem) {
        issues.push("Duplikat dengan data standar yang sudah ada di sistem.");
      }

      if (duplicateInFile) {
        issues.push("Duplikat dalam file migrasi yang sama.");
      }

      seenKeys.add(key);
    }

    return {
      row_number: normalized.row_number,
      key,
      status: issues.length ? "blocked" : "ready",
      issues,
      duplicate_in_system: duplicateInSystem,
      duplicate_in_file: duplicateInFile,
      normalized: normalized.normalized,
    };
  });

  const summary = {
    source: "AOA",
    entity,
    total_rows: rows.length,
    ready_rows: previewRows.filter((item) => item.status === "ready").length,
    blocked_rows: previewRows.filter((item) => item.status === "blocked").length,
    duplicate_rows: previewRows.filter((item) => item.duplicate_in_system || item.duplicate_in_file).length,
    empty_rows: previewRows.filter(
      (item) => !item.normalized.title && !item.normalized.category && !item.normalized.description
    ).length,
  };

  return {
    file_name: file.originalname,
    entity,
    summary,
    rows: previewRows,
  };
}

async function commitAoaMigration(file, actor, options = {}) {
  const strategy = options.strategy || "skip_duplicates";
  const preview = await parseAoaMigration(file, options.entity || "standards");
  const eligibleRows = preview.rows.filter((item) => {
    if (strategy === "overwrite_duplicates") {
      return !item.duplicate_in_file && item.normalized.title && item.normalized.category;
    }

    return item.status === "ready";
  });

  if (!eligibleRows.length) {
    throw new AppError("Tidak ada data AOA yang aman untuk dimigrasikan.", 422);
  }

  let imported = 0;
  let updated = 0;

  if (env.appMode === "local_mock") {
    const currentMap = new Map(state.standards.map((item) => [buildStandardKey(item), item]));

    eligibleRows.forEach((row) => {
      const existing = currentMap.get(row.key);
      if (existing) {
        if (strategy === "overwrite_duplicates") {
          existing.title = row.normalized.title;
          existing.category = row.normalized.category;
          existing.description = row.normalized.description;
          existing.status = row.normalized.status;
          if (row.normalized.code) {
            existing.code = row.normalized.code;
          }
          updated += 1;
        }
        return;
      }

      state.standards.unshift({
        id: `std-${Date.now()}-${imported + 1}`,
        code: row.normalized.code || `STD-AOA-${Date.now()}-${imported + 1}`,
        title: row.normalized.title,
        category: row.normalized.category,
        description: row.normalized.description,
        status: row.normalized.status,
      });
      imported += 1;
    });

    addImport({
      type: "standar",
      title: `Migrasi AOA ${preview.entity}`,
      status: "processed",
      file_name: file.originalname,
    });
  } else {
    const existing = await prisma.mutuStandard.findMany({
      where: { institutionId: actor.institutionId, deletedAt: null },
    });
    const currentMap = new Map(existing.map((item) => [buildStandardKey(item), item]));

    for (const row of eligibleRows) {
      const found = currentMap.get(row.key);
      if (found) {
        if (strategy === "overwrite_duplicates") {
          await prisma.mutuStandard.update({
            where: { id: found.id },
            data: {
              title: row.normalized.title,
              category: row.normalized.category,
              description: row.normalized.description,
              status: row.normalized.status,
            },
          });
          updated += 1;
        }
        continue;
      }

      await prisma.mutuStandard.create({
        data: {
          institutionId: actor.institutionId,
          title: row.normalized.title,
          category: row.normalized.category,
          description: row.normalized.description,
          status: row.normalized.status,
        },
      });
      imported += 1;
    }

    if (actor?.id) {
      await prisma.importJob.create({
        data: {
          type: "standar",
          fileName: file.originalname,
          storedName: file.filename,
          status: "selesai",
          createdById: actor.id,
          summary: {
            source: "AOA",
            entity: preview.entity,
            strategy,
            total_rows: preview.summary.total_rows,
            imported_rows: imported,
            updated_rows: updated,
            blocked_rows: preview.summary.blocked_rows,
          },
        },
      });
    }
  }

  return {
    file_name: preview.file_name,
    entity: preview.entity,
    strategy,
    summary: {
      ...preview.summary,
      imported_rows: imported,
      updated_rows: updated,
      committed_rows: imported + updated,
    },
  };
}

module.exports = {
  parseAoaMigration,
  commitAoaMigration,
};
