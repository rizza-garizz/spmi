const { z } = require("zod");

const nullableStringId = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().min(1).nullable()
);

const objectId = z.string().min(1);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const standardSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  category: z.string().min(2),
  status: z.enum(["aktif", "nonaktif"]).default("aktif"),
});

const documentSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  standard_id: nullableStringId.optional(),
  unit_kerja_id: nullableStringId.optional(),
});

const ppeppSchema = z.object({
  standar_id: objectId,
  unit_kerja_id: objectId,
  fase: z.enum(["P1", "P2", "E", "P3", "P4"]),
  isi: z.string().min(3),
  status: z.enum(["draft", "berjalan", "selesai", "ditutup"]).default("draft"),
  tahun: z.coerce.number().int().min(2000).max(2100),
});

const amiSchema = z.object({
  title: z.string().min(3),
  jadwal: z.string().datetime(),
  auditor_id: objectId,
  auditee_id: objectId,
  status: z.enum(["draft", "terjadwal", "berjalan", "selesai"]).default("terjadwal"),
  catatan: z.string().optional().nullable(),
});

const findingSchema = z.object({
  title: z.string().min(3),
  deskripsi: z.string().min(3),
  severity: z.enum(["rendah", "sedang", "tinggi", "kritis"]),
  kategori: z.string().min(2),
  rencana_tindak_lanjut: z.string().optional().nullable(),
  status_rtl: z.enum(["draft", "berjalan", "selesai", "ditutup"]).default("draft"),
  tenggat: z.string().datetime().optional().nullable(),
});

const rtmSchema = z.object({
  tanggal: z.string().datetime(),
  peserta: z.array(z.string().min(1)).min(1),
  agenda: z.string().min(3),
  hasil_keputusan: z.string().min(3),
  status: z.enum(["berjalan", "selesai"]).default("berjalan"),
});

const surveySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  questions: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(["text", "textarea", "radio", "checkbox", "number", "select"]),
      options: z.array(z.string()).optional(),
      required: z.boolean().default(false),
    })
  ).min(1),
  status: z.enum(["draft", "aktif", "ditutup"]).default("draft"),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
});

const surveyAnswerSchema = z.object({
  respondent_name: z.string().optional().nullable(),
  respondent_email: z.string().email().optional().nullable(),
  answers: z.record(z.any()),
});

const settingSchema = z.object({
  institution_name: z.string().min(3),
  academic_year: z.string().min(4),
  system_name: z.string().min(3),
  configuration: z.record(z.any()).optional().nullable(),
});

const integrationSyncSchema = z.object({
  service: z.string().min(2).default("pddikti"),
});

module.exports = {
  loginSchema,
  standardSchema,
  documentSchema,
  ppeppSchema,
  amiSchema,
  findingSchema,
  rtmSchema,
  surveySchema,
  surveyAnswerSchema,
  settingSchema,
  integrationSyncSchema,
};
