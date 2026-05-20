const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const institution = await prisma.institution.upsert({
    where: { code: "DEFAULT" },
    update: {
      name: "Universitas Junrejo Indah",
      systemName: "SPMI Command Center",
      academicYear: "2026/2027",
      configuration: {
        locale: "id-ID",
        timezone: "Asia/Jakarta",
      },
    },
    create: {
      id: "inst-default",
      code: "DEFAULT",
      name: "Universitas Junrejo Indah",
      systemName: "SPMI Command Center",
      academicYear: "2026/2027",
      configuration: {
        locale: "id-ID",
        timezone: "Asia/Jakarta",
      },
    },
  });

  const [lpm, faculty, prodi] = await Promise.all([
    prisma.orgUnit.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: "LPM" } },
      update: {},
      create: {
        institutionId: institution.id,
        name: "Lembaga Penjaminan Mutu",
        code: "LPM",
        type: "lembaga",
      },
    }),
    prisma.orgUnit.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: "FE" } },
      update: {},
      create: {
        institutionId: institution.id,
        name: "Fakultas Ekonomi",
        code: "FE",
        type: "fakultas",
      },
    }),
    prisma.orgUnit.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: "TI" } },
      update: {},
      create: {
        institutionId: institution.id,
        name: "Program Studi Teknik Informatika",
        code: "TI",
        type: "prodi",
      },
    }),
  ]);

  await prisma.orgUnit.update({
    where: { id: prodi.id },
    data: { parentId: faculty.id },
  });

  const defaultPassword = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@spmi.local" },
    update: {
      name: "Admin LPM",
      passwordHash: defaultPassword,
      role: "admin_lpm",
      institutionId: institution.id,
      orgUnitId: lpm.id,
    },
    create: {
      name: "Admin LPM",
      email: "admin@spmi.local",
      passwordHash: defaultPassword,
      role: "admin_lpm",
      institutionId: institution.id,
      orgUnitId: lpm.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role_scopeOrgUnitId: { userId: admin.id, role: "admin_lpm", scopeOrgUnitId: lpm.id } },
    update: {},
    create: { userId: admin.id, role: "admin_lpm", scopeOrgUnitId: lpm.id },
  });

  const auditor = await prisma.user.upsert({
    where: { email: "auditor@spmi.local" },
    update: {
      name: "Auditor Internal",
      passwordHash: defaultPassword,
      role: "auditor",
      institutionId: institution.id,
      orgUnitId: faculty.id,
    },
    create: {
      name: "Auditor Internal",
      email: "auditor@spmi.local",
      passwordHash: defaultPassword,
      role: "auditor",
      institutionId: institution.id,
      orgUnitId: faculty.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role_scopeOrgUnitId: { userId: auditor.id, role: "auditor", scopeOrgUnitId: faculty.id } },
    update: {},
    create: { userId: auditor.id, role: "auditor", scopeOrgUnitId: faculty.id },
  });

  const dekan = await prisma.user.upsert({
    where: { email: "dekan@spmi.local" },
    update: {
      name: "Dekan Fakultas",
      passwordHash: defaultPassword,
      role: "dekan",
      institutionId: institution.id,
      orgUnitId: faculty.id,
    },
    create: {
      name: "Dekan Fakultas",
      email: "dekan@spmi.local",
      passwordHash: defaultPassword,
      role: "dekan",
      institutionId: institution.id,
      orgUnitId: faculty.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role_scopeOrgUnitId: { userId: dekan.id, role: "dekan", scopeOrgUnitId: faculty.id } },
    update: {},
    create: { userId: dekan.id, role: "dekan", scopeOrgUnitId: faculty.id },
  });

  const wadek = await prisma.user.upsert({
    where: { email: "wadek@spmi.local" },
    update: {
      name: "Wakil Dekan",
      passwordHash: defaultPassword,
      role: "wakil_dekan",
      institutionId: institution.id,
      orgUnitId: faculty.id,
    },
    create: {
      name: "Wakil Dekan",
      email: "wadek@spmi.local",
      passwordHash: defaultPassword,
      role: "wakil_dekan",
      institutionId: institution.id,
      orgUnitId: faculty.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role_scopeOrgUnitId: { userId: wadek.id, role: "wakil_dekan", scopeOrgUnitId: faculty.id } },
    update: {},
    create: { userId: wadek.id, role: "wakil_dekan", scopeOrgUnitId: faculty.id },
  });

  const kaprodi = await prisma.user.upsert({
    where: { email: "kaprodi@spmi.local" },
    update: {
      name: "Ketua Program Studi",
      passwordHash: defaultPassword,
      role: "kaprodi",
      institutionId: institution.id,
      orgUnitId: prodi.id,
    },
    create: {
      name: "Ketua Program Studi",
      email: "kaprodi@spmi.local",
      passwordHash: defaultPassword,
      role: "kaprodi",
      institutionId: institution.id,
      orgUnitId: prodi.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role_scopeOrgUnitId: { userId: kaprodi.id, role: "kaprodi", scopeOrgUnitId: prodi.id } },
    update: {},
    create: { userId: kaprodi.id, role: "kaprodi", scopeOrgUnitId: prodi.id },
  });

  const sekprodi = await prisma.user.upsert({
    where: { email: "sekprodi@spmi.local" },
    update: {
      name: "Sekretaris Program Studi",
      passwordHash: defaultPassword,
      role: "sekprodi",
      institutionId: institution.id,
      orgUnitId: prodi.id,
    },
    create: {
      name: "Sekretaris Program Studi",
      email: "sekprodi@spmi.local",
      passwordHash: defaultPassword,
      role: "sekprodi",
      institutionId: institution.id,
      orgUnitId: prodi.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role_scopeOrgUnitId: { userId: sekprodi.id, role: "sekprodi", scopeOrgUnitId: prodi.id } },
    update: {},
    create: { userId: sekprodi.id, role: "sekprodi", scopeOrgUnitId: prodi.id },
  });

  const unit = await prisma.user.upsert({
    where: { email: "unit@spmi.local" },
    update: {
      name: "Operator Unit Kerja",
      passwordHash: defaultPassword,
      role: "unit_kerja",
      institutionId: institution.id,
      orgUnitId: prodi.id,
    },
    create: {
      name: "Operator Unit Kerja",
      email: "unit@spmi.local",
      passwordHash: defaultPassword,
      role: "unit_kerja",
      institutionId: institution.id,
      orgUnitId: prodi.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role_scopeOrgUnitId: { userId: unit.id, role: "unit_kerja", scopeOrgUnitId: prodi.id } },
    update: {},
    create: { userId: unit.id, role: "unit_kerja", scopeOrgUnitId: prodi.id },
  });

  const standard1 = await prisma.mutuStandard.upsert({
    where: { id: "std-visi-misi" },
    update: {},
    create: {
      id: "std-visi-misi",
      institutionId: institution.id,
      title: "Standar Visi, Misi, Tujuan, dan Strategi",
      description: "Standar mutu terkait arah strategis institusi.",
      category: "Tata Kelola",
      status: "aktif",
    },
  });

  const standard2 = await prisma.mutuStandard.upsert({
    where: { id: "std-pembelajaran" },
    update: {},
    create: {
      id: "std-pembelajaran",
      institutionId: institution.id,
      title: "Standar Proses Pembelajaran",
      description: "Standar mutu pelaksanaan pembelajaran.",
      category: "Akademik",
      status: "aktif",
    },
  });

  await prisma.systemSetting.upsert({
    where: { institutionId: institution.id },
    update: {},
    create: {
      institutionId: institution.id,
      institutionName: "Universitas Junrejo Indah",
      academicYear: "2026/2027",
      systemName: "SPMI Command Center",
      configuration: {
        locale: "id-ID",
        timezone: "Asia/Jakarta",
      },
    },
  });

  const audit = await prisma.amiAudit.upsert({
    where: { id: "ami-seed-2026" },
    update: {},
    create: {
      id: "ami-seed-2026",
      title: "AMI Semester Genap 2026",
      scheduledDate: new Date("2026-06-10T09:00:00.000Z"),
      auditorId: auditor.id,
      auditeeUnitId: prodi.id,
      status: "terjadwal",
      notes: "Audit awal untuk simulasi sistem.",
    },
  });

  await prisma.amiFinding.upsert({
    where: { id: "finding-seed-2026" },
    update: {},
    create: {
      id: "finding-seed-2026",
      auditId: audit.id,
      title: "Dokumen RPS belum lengkap",
      description: "Sebagian RPS belum diperbarui sesuai CPL terbaru.",
      severity: "sedang",
      category: "Dokumen Akademik",
      rtlPlan: "Melakukan revisi RPS oleh tim kurikulum.",
      rtlStatus: "berjalan",
      dueDate: new Date("2026-07-01T00:00:00.000Z"),
    },
  });

  await prisma.ppeppCycle.upsert({
    where: { id: "ppepp-seed-penetapan" },
    update: {},
    create: {
      id: "ppepp-seed-penetapan",
      standardId: standard1.id,
      orgUnitId: lpm.id,
      phase: "P1",
      content: "Penetapan indikator mutu institusi.",
      status: "selesai",
      year: 2026,
      createdById: admin.id,
    },
  });

  await prisma.ppeppCycle.upsert({
    where: { id: "ppepp-seed-evaluasi" },
    update: {},
    create: {
      id: "ppepp-seed-evaluasi",
      standardId: standard2.id,
      orgUnitId: prodi.id,
      phase: "E",
      content: "Evaluasi pelaksanaan pembelajaran semester genap.",
      status: "berjalan",
      year: 2026,
      createdById: admin.id,
    },
  });

  console.log("Seed selesai dijalankan.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
