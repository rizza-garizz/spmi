const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { parse } = require("csv-parse/sync");

function readTabularFile(filePath, mimeType) {
  if (mimeType === "text/csv") {
    const content = fs.readFileSync(filePath, "utf8");
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  const workbook = XLSX.readFile(filePath);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
}

function normalizeStandardRow(row) {
  return {
    title: row.judul || row.title || row.nama || "",
    description: row.deskripsi || row.description || "",
    category: row.kategori || row.category || "Umum",
    status: String(row.status || "aktif").toLowerCase() === "nonaktif" ? "nonaktif" : "aktif",
  };
}

function getFileStats(file) {
  return {
    file_name: file.originalname,
    stored_name: path.basename(file.path),
    mime_type: file.mimetype,
    size_bytes: file.size,
  };
}

module.exports = {
  readTabularFile,
  normalizeStandardRow,
  getFileStats,
};
