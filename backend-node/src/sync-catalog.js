const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function syncCatalog() {
  const catalogPath = path.resolve(__dirname, "../../frontend/data/spmi-catalog.json");
  console.log(`Membaca catalog dari: ${catalogPath}`);

  if (!fs.existsSync(catalogPath)) {
    console.error("File spmi-catalog.json tidak ditemukan!");
    process.exit(1);
  }

  const rawData = fs.readFileSync(catalogPath, "utf-8");
  const catalog = JSON.parse(rawData);
  const institution = await prisma.institution.upsert({
    where: { code: "DEFAULT" },
    update: {},
    create: {
      id: "inst-default",
      code: "DEFAULT",
      name: "Universitas Junrejo Indah",
      systemName: "SPMI Command Center",
      academicYear: "2026/2027",
    },
  });

  console.log(`Ditemukan ${catalog.standards.length} standar untuk disinkronisasi...`);

  // Sinkronisasi MutuStandard
  for (const std of catalog.standards) {
    await prisma.mutuStandard.upsert({
      where: { id: String(std.id) },
      update: {
        title: std.title,
        description: std.description,
        category: std.category,
        status: "aktif",
      },
      create: {
        id: String(std.id),
        institutionId: institution.id,
        title: std.title,
        description: std.description,
        category: std.category,
        status: "aktif",
      },
    });
  }

  console.log("✅ MutuStandard berhasil disinkronisasi!");

  // Boleh tambahkan sinkronisasi dokumen
  if (catalog.spmiDocuments && catalog.spmiDocuments.length > 0) {
    console.log(`Ditemukan ${catalog.spmiDocuments.length} referensi dokumen...`);
    // Cari user admin pertama untuk author upload
    const admin = await prisma.user.findFirst({ where: { role: "admin_lpm" } });
    if (admin) {
      for (const doc of catalog.spmiDocuments) {
        // Buat id sementara (hash dr judul) atau pakai slug
        const docId = `doc-${doc.title.replace(/\s+/g, '-').toLowerCase()}`.substring(0, 30);
        await prisma.spmiDocument.upsert({
          where: { id: docId },
          update: {
            title: doc.title,
            description: doc.description,
          },
          create: {
            id: docId,
            title: doc.title,
            description: doc.description,
            fileName: doc.url, // save url in filename
            storedName: doc.url,
            mimeType: "url",
            sizeBytes: 0,
            uploadedById: admin.id
          }
        });
      }
      console.log("✅ SpmiDocument berhasil disinkronisasi!");
    }
  }

  console.log("✅ Sinkronisasi selesai.");
}

syncCatalog()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
