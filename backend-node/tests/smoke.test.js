const test = require("node:test");
const assert = require("node:assert/strict");

process.env.APP_MODE = "local_mock";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1d";

const app = require("../src/app");

let server;
let baseUrl;

function buildAoaCsv() {
  return [
    "code,title,category,description,status",
    "STD-AOA-01,Standar AOA Baru,pendidikan,Baris valid dari AOA,aktif",
    "STD-AOA-02,Standar Pembelajaran,pendidikan,Duplikat dengan data seed,aktif",
    "STD-AOA-03,,pendidikan,Baris tanpa judul,aktif",
  ].join("\n");
}

async function loginAs(email, password = "Password123!") {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);

  return payload.data.token;
}

test.before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /health returns healthy payload", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.status, "ok");
});

test("GET /system/status exposes local_mock mode", async () => {
  const response = await fetch(`${baseUrl}/system/status`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.app_mode, "local_mock");
  assert.equal(payload.data.seed_mode_active, true);
});

test("POST /auth/login accepts local seed user", async () => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@spmi.local",
      password: "Password123!",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.ok(payload.data.token);
  assert.equal(payload.data.mode, "local");
});

test("GET /auth/me returns current local profile", async () => {
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "auditor@spmi.local",
      password: "Password123!",
    }),
  });
  const loginPayload = await loginResponse.json();

  const response = await fetch(`${baseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${loginPayload.data.token}`,
    },
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.email, "auditor@spmi.local");
  assert.equal(payload.data.mode, "local");
  assert.equal(payload.data.org_unit.code, "LPM");
  assert.equal(payload.data.role_assignments[0].scope_org_unit.code, "LPM");
});

test("local seed users carry perguruan tinggi role scopes", async () => {
  const cases = [
    ["admin@spmi.local", "admin_lpm", "LPM"],
    ["dekan@spmi.local", "dekan", "FIKOM"],
    ["kaprodi@spmi.local", "kaprodi", "SI"],
    ["unit@spmi.local", "unit_kerja", "SI"],
  ];

  for (const [email, role, orgCode] of cases) {
    const token = await loginAs(email);
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.role, role);
    assert.equal(payload.data.org_unit.code, orgCode);
    assert.equal(payload.data.role_assignments[0].scope_org_unit.code, orgCode);
  }
});

test("GET /dashboard/summary returns KPI snapshot", async () => {
  const token = await loginAs("admin@spmi.local");
  const response = await fetch(`${baseUrl}/dashboard/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.ok(Array.isArray(payload.data.metrics));
  assert.ok(Array.isArray(payload.data.performance));
  assert.equal(typeof payload.data.kpi.average_achievement, "number");
  assert.ok(Array.isArray(payload.data.standardAchievement));
});

test("dashboard supports filters and export payloads", async () => {
  const filteredResponse = await fetch(`${baseUrl}/dashboard/summary?fakultas=FIKOM&tahun=2026`);
  const filteredPayload = await filteredResponse.json();

  assert.equal(filteredResponse.status, 200);
  assert.equal(filteredPayload.success, true);
  assert.equal(filteredPayload.data.filters.fakultas, "FIKOM");
  assert.equal(
    filteredPayload.data.performance.every(
      (item) => item.fakultas === "Fakultas Ilmu Komputer" || item.org_unit_code === "FIKOM"
    ),
    true
  );

  const excelResponse = await fetch(`${baseUrl}/dashboard/export?format=excel&fakultas=FIKOM`);
  const excelText = await excelResponse.text();

  assert.equal(excelResponse.status, 200);
  assert.equal(excelResponse.headers.get("content-type").includes("text/csv"), true);
  assert.equal(excelText.includes("Kode"), true);

  const pdfResponse = await fetch(`${baseUrl}/dashboard/export?format=pdf`);
  const pdfText = await pdfResponse.text();

  assert.equal(pdfResponse.status, 200);
  assert.equal(pdfResponse.headers.get("content-type").includes("text/html"), true);
  assert.equal(pdfText.includes("Dashboard KPI Mutu"), true);
});

test("GET /catalog exposes the required standard groups", async () => {
  const response = await fetch(`${baseUrl}/catalog`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(
    payload.data.standardCategories.map((item) => item.key),
    ["pendidikan", "penelitian", "pengabdian", "tata_kelola", "sdm", "keuangan", "sarpras"]
  );
});

test("POST /standards creates a local standard with automatic numbering and version history", async () => {
  const token = await loginAs("admin@spmi.local");
  const response = await fetch(`${baseUrl}/standards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Standar Pengembangan SDM",
      category: "sdm",
      description: "Uji create standard dengan kode otomatis",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.match(payload.data.code, /^STD-SDM-\d{2}$/);
  assert.equal(payload.data.version, "1.0");
  assert.equal(payload.data.revisions[0].action, "created");
});

test("PUT and DELETE /standards keep revision history and hide deleted rows", async () => {
  const token = await loginAs("admin@spmi.local");
  const createdResponse = await fetch(`${baseUrl}/standards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Standar Akuntabilitas Keuangan Test",
      category: "keuangan",
      description: "Draft awal",
    }),
  });
  const createdPayload = await createdResponse.json();
  const standardId = createdPayload.data.id;

  const updateResponse = await fetch(`${baseUrl}/standards/${standardId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Standar Akuntabilitas Keuangan Revisi",
      description: "Draft revisi",
      revision_note: "Menambahkan cakupan akuntabilitas.",
    }),
  });
  const updatePayload = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.equal(updatePayload.data.version, "1.1");
  assert.equal(updatePayload.data.revisions[0].action, "updated");

  const revisionsResponse = await fetch(`${baseUrl}/standards/${standardId}/revisions`);
  const revisionsPayload = await revisionsResponse.json();

  assert.equal(revisionsResponse.status, 200);
  assert.equal(revisionsPayload.data.length, 2);

  const deleteResponse = await fetch(`${baseUrl}/standards/${standardId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const deletePayload = await deleteResponse.json();

  assert.equal(deleteResponse.status, 200);
  assert.equal(deletePayload.data.status, "deleted");

  const listResponse = await fetch(`${baseUrl}/standards`);
  const listPayload = await listResponse.json();
  assert.equal(listResponse.status, 200);
  assert.equal(listPayload.data.some((item) => item.id === standardId), false);
});

test("documents support metadata, versions, preview, scoped download, and duplicate validation", async () => {
  const token = await loginAs("unit@spmi.local");
  const form = new FormData();
  form.append("code", "DOC-UNIT-TEST");
  form.append("title", "Dokumen Evaluasi Unit");
  form.append("type", "laporan_ami");
  form.append("category", "AMI");
  form.append("document_date", "2026-05-20");
  form.append("owner", "Unit Operator");
  form.append("file", new Blob(["unit,dokumen"], { type: "text/csv" }), "dokumen-unit.csv");

  const response = await fetch(`${baseUrl}/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = await response.json();
  const document = payload.data;
  const versionId = document.versions[0].id;

  assert.equal(response.status, 201);
  assert.equal(document.metadata.tanggal, "2026-05-20");
  assert.equal(document.metadata.kategori, "AMI");
  assert.equal(document.metadata.penanggung_jawab, "Unit Operator");
  assert.equal(document.current_version, "1.0");

  const duplicateForm = new FormData();
  duplicateForm.append("code", "DOC-UNIT-TEST");
  duplicateForm.append("title", "Dokumen Evaluasi Unit");
  duplicateForm.append("type", "laporan_ami");
  duplicateForm.append("file", new Blob(["unit,dokumen"], { type: "text/csv" }), "dokumen-unit.csv");
  const duplicateResponse = await fetch(`${baseUrl}/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: duplicateForm,
  });
  assert.equal(duplicateResponse.status, 409);

  const versionForm = new FormData();
  versionForm.append("notes", "Revisi bukti evaluasi.");
  versionForm.append("file", new Blob(["unit,dokumen,revisi"], { type: "text/csv" }), "dokumen-unit-v2.csv");
  const versionResponse = await fetch(`${baseUrl}/documents/${document.id}/versions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: versionForm,
  });
  const versionPayload = await versionResponse.json();
  assert.equal(versionResponse.status, 201);
  assert.equal(versionPayload.data.current_version, "2.0");
  assert.equal(versionPayload.data.versions.length, 2);

  const metaResponse = await fetch(`${baseUrl}/documents/versions/${versionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const metaPayload = await metaResponse.json();
  assert.equal(metaResponse.status, 200);
  assert.ok(metaPayload.data.download_url.includes("/download"));
  assert.ok(metaPayload.data.preview_url.includes("/preview"));

  const previewResponse = await fetch(`${baseUrl}/documents/versions/${versionId}/preview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const previewPayload = await previewResponse.json();
  assert.equal(previewResponse.status, 200);
  assert.equal(previewPayload.data.document.id, document.id);

  const downloadResponse = await fetch(`${baseUrl}/documents/versions/${versionId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const downloadPayload = await downloadResponse.json();
  assert.equal(downloadResponse.status, 200);
  assert.equal(downloadPayload.data.file_name, "dokumen-unit.csv");
});

test("POST /ppepp/cycles creates a local PPEPP cycle", async () => {
  const token = await loginAs("unit@spmi.local");
  const response = await fetch(`${baseUrl}/ppepp/cycles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Siklus Test",
      period: "yearly",
      status: "planned",
      academic_year_start: 2026,
      academic_year_end: 2027,
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.name, "Siklus Test");
  assert.equal(payload.data.stages.length, 5);
  assert.deepEqual(
    payload.data.stages.map((stage) => stage.key),
    ["penetapan", "pelaksanaan", "evaluasi", "pengendalian", "peningkatan"]
  );
  assert.ok(Array.isArray(payload.data.timeline));
});

test("PPEPP stages track status, timeline, progress, and evidence upload", async () => {
  const token = await loginAs("unit@spmi.local");
  const createdResponse = await fetch(`${baseUrl}/ppepp/cycles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Siklus Evidence Test",
      period: "semester",
      status: "planned",
    }),
  });
  const createdPayload = await createdResponse.json();
  const cycleId = createdPayload.data.id;

  const stageResponse = await fetch(`${baseUrl}/ppepp/cycles/${cycleId}/stages/penetapan`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      status: "completed",
      progress: 100,
      notes: "Standar sudah ditetapkan.",
    }),
  });
  const stagePayload = await stageResponse.json();

  assert.equal(stageResponse.status, 200);
  assert.equal(stagePayload.data.stages.find((stage) => stage.key === "penetapan").status, "completed");
  assert.equal(stagePayload.data.progress, 20);
  assert.equal(stagePayload.data.timeline[0].action, "stage_updated");

  const evidenceForm = new FormData();
  evidenceForm.append("title", "SK Penetapan Standar");
  evidenceForm.append("file", new Blob(["bukti,penetapan"], { type: "text/csv" }), "sk-penetapan.csv");

  const evidenceResponse = await fetch(`${baseUrl}/ppepp/cycles/${cycleId}/stages/penetapan/evidence`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: evidenceForm,
  });
  const evidencePayload = await evidenceResponse.json();

  assert.equal(evidenceResponse.status, 201);
  assert.equal(evidencePayload.data.stage.evidence.length, 1);
  assert.equal(evidencePayload.data.cycle.timeline[0].action, "evidence_uploaded");
});

test("POST /ami/audits creates a local audit", async () => {
  const token = await loginAs("auditor@spmi.local");
  const response = await fetch(`${baseUrl}/ami/audits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      org_unit_id: 2,
      audit_date: "2026-05-12",
      auditor_name: "Auditor Mutu",
      score: 88,
      status: "terjadwal",
      finding_summary: "Temuan uji",
      finding_category: "Minor",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.auditor.name, "Auditor Mutu");
  assert.equal(payload.data.instruments.length, 3);
  assert.equal(payload.data.findings[0].category, "Minor");
  assert.equal(payload.data.recap.categories.minor, 1);
});

test("AMI workflow supports assignment, instruments, findings, follow-up, verification, and summary", async () => {
  const auditorToken = await loginAs("auditor@spmi.local");
  const unitToken = await loginAs("unit@spmi.local");

  const createdResponse = await fetch(`${baseUrl}/ami/audits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auditorToken}`,
    },
    body: JSON.stringify({
      org_unit_id: 2,
      org_unit_code: "SI",
      org_unit_name: "Program Studi Sistem Informasi",
      audit_date: "2026-05-14",
      status: "terjadwal",
    }),
  });
  const createdPayload = await createdResponse.json();
  const auditId = createdPayload.data.id;
  const instrumentId = createdPayload.data.instruments[0].id;

  const assignmentResponse = await fetch(`${baseUrl}/ami/audits/${auditId}/assignment`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auditorToken}`,
    },
    body: JSON.stringify({
      auditor_name: "Auditor Senior",
      scheduled_date: "2026-05-20",
      status: "berjalan",
    }),
  });
  const assignmentPayload = await assignmentResponse.json();

  assert.equal(assignmentResponse.status, 200);
  assert.equal(assignmentPayload.data.auditor.name, "Auditor Senior");
  assert.equal(assignmentPayload.data.status, "berjalan");

  const instrumentResponse = await fetch(`${baseUrl}/ami/audits/${auditId}/instruments/${instrumentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auditorToken}`,
    },
    body: JSON.stringify({
      status: "checked",
      score: 90,
      notes: "Instrumen lengkap.",
    }),
  });
  const instrumentPayload = await instrumentResponse.json();

  assert.equal(instrumentResponse.status, 200);
  assert.equal(instrumentPayload.data.recap.instrument_checked, 1);

  const findingResponse = await fetch(`${baseUrl}/ami/audits/${auditId}/findings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auditorToken}`,
    },
    body: JSON.stringify({
      title: "Dokumen evaluasi belum lengkap",
      description: "Unit belum melampirkan bukti evaluasi pembelajaran.",
      category: "Mayor",
      recommendation: "Lengkapi dokumen evaluasi dan unggah bukti.",
      follow_up_plan: "Kumpulkan bukti evaluasi.",
    }),
  });
  const findingPayload = await findingResponse.json();
  const findingId = findingPayload.data.id;

  assert.equal(findingResponse.status, 201);
  assert.equal(findingPayload.data.category, "Mayor");

  const followUpResponse = await fetch(`${baseUrl}/ami/audits/${auditId}/findings/${findingId}/follow-up`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${unitToken}`,
    },
    body: JSON.stringify({
      status: "in_progress",
      progress: 80,
      evidence_title: "Bukti evaluasi pembelajaran",
    }),
  });
  const followUpPayload = await followUpResponse.json();

  assert.equal(followUpResponse.status, 200);
  assert.equal(followUpPayload.data.findings[0].follow_up.progress, 80);
  assert.equal(followUpPayload.data.recap.follow_up_open, 1);

  const verificationResponse = await fetch(`${baseUrl}/ami/audits/${auditId}/findings/${findingId}/verification`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auditorToken}`,
    },
    body: JSON.stringify({
      status: "verified",
      notes: "Bukti sudah sesuai.",
    }),
  });
  const verificationPayload = await verificationResponse.json();

  assert.equal(verificationResponse.status, 200);
  assert.equal(verificationPayload.data.recap.verified, 1);
  assert.equal(verificationPayload.data.recap.follow_up_done, 1);

  const summaryResponse = await fetch(`${baseUrl}/ami/audits/${auditId}/summary`, {
    headers: {
      Authorization: `Bearer ${auditorToken}`,
    },
  });
  const summaryPayload = await summaryResponse.json();

  assert.equal(summaryResponse.status, 200);
  assert.equal(summaryPayload.data.categories.mayor, 1);
});

test("POST /rtm/meetings creates a local meeting", async () => {
  const token = await loginAs("admin@spmi.local");
  const response = await fetch(`${baseUrl}/rtm/meetings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "RTM Test",
      meeting_date: "2026-05-12",
      conclusion: "Kesimpulan test",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.title, "RTM Test");
});

test("POST /indicators and /values create indicator data", async () => {
  const token = await loginAs("unit@spmi.local");
  const createIndicatorResponse = await fetch(`${baseUrl}/indicators`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      code: "IKU-TEST-01",
      name: "Indikator Test",
      description: "Uji indikator",
      target_value: 90,
      unit: "%",
      source_type: "manual",
    }),
  });
  const createIndicatorPayload = await createIndicatorResponse.json();

  assert.equal(createIndicatorResponse.status, 201);
  assert.equal(createIndicatorPayload.success, true);

  const createValueResponse = await fetch(
    `${baseUrl}/indicators/${createIndicatorPayload.data.id}/values`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        period: "2026-Q2",
        actual_value: 91,
        notes: "Melebihi target",
      }),
    }
  );
  const createValuePayload = await createValueResponse.json();

  assert.equal(createValueResponse.status, 201);
  assert.equal(createValuePayload.success, true);
  assert.equal(createValuePayload.data.actual_value, 91);
});

test("row-level access filters prodi and faculty scoped indicators", async () => {
  const adminToken = await loginAs("admin@spmi.local");
  const dekanToken = await loginAs("dekan@spmi.local");
  const unitToken = await loginAs("unit@spmi.local");

  const [adminResponse, dekanResponse, unitResponse] = await Promise.all([
    fetch(`${baseUrl}/indicators`, { headers: { Authorization: `Bearer ${adminToken}` } }),
    fetch(`${baseUrl}/indicators`, { headers: { Authorization: `Bearer ${dekanToken}` } }),
    fetch(`${baseUrl}/indicators`, { headers: { Authorization: `Bearer ${unitToken}` } }),
  ]);

  const adminPayload = await adminResponse.json();
  const dekanPayload = await dekanResponse.json();
  const unitPayload = await unitResponse.json();

  assert.equal(adminResponse.status, 200);
  assert.equal(dekanResponse.status, 200);
  assert.equal(unitResponse.status, 200);
  assert.ok(adminPayload.data.length >= 3);
  assert.ok(dekanPayload.data.every((item) => ["FIKOM", "SI"].includes(item.org_unit_code)));
  assert.ok(unitPayload.data.every((item) => item.org_unit_code === "SI"));
});

test("row-level access rejects writes outside user scope", async () => {
  const unitToken = await loginAs("unit@spmi.local");

  const createOutsideScope = await fetch(`${baseUrl}/indicators`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${unitToken}`,
    },
    body: JSON.stringify({
      code: "IKU-FIKOM-FORBIDDEN",
      name: "Indikator Luar Scope",
      target_value: 80,
      unit: "%",
      org_unit_code: "FIKOM",
    }),
  });
  const createPayload = await createOutsideScope.json();

  assert.equal(createOutsideScope.status, 403);
  assert.equal(createPayload.success, false);

  const updateFacultyRtl = await fetch(`${baseUrl}/rtm/meetings/1/actions/102`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${unitToken}`,
    },
    body: JSON.stringify({
      status: "done",
      progress: 100,
    }),
  });
  const updatePayload = await updateFacultyRtl.json();

  assert.equal(updateFacultyRtl.status, 403);
  assert.equal(updatePayload.success, false);
});

test("approval workflow follows unit prodi faculty lpm hierarchy", async () => {
  const unitToken = await loginAs("unit@spmi.local");
  const kaprodiToken = await loginAs("kaprodi@spmi.local");
  const dekanToken = await loginAs("dekan@spmi.local");
  const adminToken = await loginAs("admin@spmi.local");

  const createResponse = await fetch(`${baseUrl}/indicators`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${unitToken}`,
    },
    body: JSON.stringify({
      code: "IKU-APPROVAL-01",
      name: "Indikator Approval",
      target_value: 90,
      unit: "%",
    }),
  });
  const createPayload = await createResponse.json();
  assert.equal(createResponse.status, 201);
  assert.equal(createPayload.data.org_unit_code, "SI");
  assert.equal(createPayload.data.approval.step, "draft");

  const submitResponse = await fetch(`${baseUrl}/governance/indicators/${createPayload.data.id}/approval`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${unitToken}`,
    },
    body: JSON.stringify({ action: "submit", note: "Siap review prodi" }),
  });
  const submitPayload = await submitResponse.json();
  assert.equal(submitResponse.status, 200);
  assert.equal(submitPayload.data.approval.step, "review_prodi");

  const forbiddenFacultyApproval = await fetch(`${baseUrl}/governance/indicators/${createPayload.data.id}/approval`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${dekanToken}`,
    },
    body: JSON.stringify({ action: "approve" }),
  });
  assert.equal(forbiddenFacultyApproval.status, 403);

  const prodiResponse = await fetch(`${baseUrl}/governance/indicators/${createPayload.data.id}/approval`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${kaprodiToken}`,
    },
    body: JSON.stringify({ action: "approve", note: "Valid di prodi" }),
  });
  const prodiPayload = await prodiResponse.json();
  assert.equal(prodiResponse.status, 200);
  assert.equal(prodiPayload.data.approval.step, "review_fakultas");

  const facultyResponse = await fetch(`${baseUrl}/governance/indicators/${createPayload.data.id}/approval`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${dekanToken}`,
    },
    body: JSON.stringify({ action: "approve", note: "Valid di fakultas" }),
  });
  const facultyPayload = await facultyResponse.json();
  assert.equal(facultyResponse.status, 200);
  assert.equal(facultyPayload.data.approval.step, "review_lpm");

  const lpmResponse = await fetch(`${baseUrl}/governance/indicators/${createPayload.data.id}/approval`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ action: "approve", note: "Disahkan LPM" }),
  });
  const lpmPayload = await lpmResponse.json();
  assert.equal(lpmResponse.status, 200);
  assert.equal(lpmPayload.data.approval.status, "approved");
});

test("PATCH /rtm/meetings/:meetingId/actions/:actionId updates RTL progress for unit role", async () => {
  const unitToken = await loginAs("unit@spmi.local");
  const adminToken = await loginAs("admin@spmi.local");
  const listResponse = await fetch(`${baseUrl}/rtm/meetings`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  const listPayload = await listResponse.json();
  const meetings = listPayload.data;
  const meetingWithAction = meetings.find((item) =>
    Array.isArray(item.actions) && item.actions.some((entry) => entry.org_unit_code === "SI")
  );

  assert.equal(listResponse.status, 200);
  assert.ok(meetingWithAction);

  const action = meetingWithAction.actions.find((entry) => entry.org_unit_code === "SI");
  const updateResponse = await fetch(
    `${baseUrl}/rtm/meetings/${meetingWithAction.id}/actions/${action.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${unitToken}`,
      },
      body: JSON.stringify({
        status: "done",
        progress: 100,
        owner_notes: "Tindak lanjut selesai diverifikasi unit kerja.",
      }),
    }
  );
  const updatePayload = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.equal(updatePayload.success, true);
  assert.equal(updatePayload.data.status, "done");
  assert.equal(updatePayload.data.progress, 100);
});

test("PATCH /rtm/meetings/:meetingId/actions/:actionId rejects auditor role", async () => {
  const auditorToken = await loginAs("auditor@spmi.local");
  const response = await fetch(`${baseUrl}/rtm/meetings/1/actions/101`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auditorToken}`,
    },
    body: JSON.stringify({
      status: "in_progress",
      progress: 70,
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 403);
  assert.equal(payload.success, false);
});

test("POST /imports/aoa/preview returns duplicate and validation summary", async () => {
  const adminToken = await loginAs("admin@spmi.local");
  const form = new FormData();
  form.append("entity", "standards");
  form.append("file", new Blob([buildAoaCsv()], { type: "text/csv" }), "aoa-standards.csv");

  const response = await fetch(`${baseUrl}/imports/aoa/preview`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: form,
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.summary.total_rows, 3);
  assert.equal(payload.data.summary.ready_rows, 1);
  assert.ok(payload.data.summary.blocked_rows >= 2);
});

test("POST /imports/aoa/commit imports ready rows and rejects non-admin", async () => {
  const unitToken = await loginAs("unit@spmi.local");
  const forbiddenForm = new FormData();
  forbiddenForm.append("entity", "standards");
  forbiddenForm.append("file", new Blob([buildAoaCsv()], { type: "text/csv" }), "aoa-standards.csv");

  const forbiddenResponse = await fetch(`${baseUrl}/imports/aoa/commit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${unitToken}`,
    },
    body: forbiddenForm,
  });
  const forbiddenPayload = await forbiddenResponse.json();

  assert.equal(forbiddenResponse.status, 403);
  assert.equal(forbiddenPayload.success, false);

  const adminToken = await loginAs("admin@spmi.local");
  const commitForm = new FormData();
  commitForm.append("entity", "standards");
  commitForm.append("strategy", "skip_duplicates");
  commitForm.append("file", new Blob([buildAoaCsv()], { type: "text/csv" }), "aoa-standards.csv");

  const response = await fetch(`${baseUrl}/imports/aoa/commit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: commitForm,
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.summary.imported_rows, 1);
});

test("compat routes enforce role restrictions", async () => {
  const unitToken = await loginAs("unit@spmi.local");
  const auditorToken = await loginAs("auditor@spmi.local");

  const readableStandards = await fetch(`${baseUrl}/standards`, {
    headers: {
      Authorization: `Bearer ${unitToken}`,
    },
  });
  const readableStandardsPayload = await readableStandards.json();

  assert.equal(readableStandards.status, 200);
  assert.equal(readableStandardsPayload.success, true);

  const forbiddenMeetingCreate = await fetch(`${baseUrl}/rtm/meetings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auditorToken}`,
    },
    body: JSON.stringify({
      title: "RTM Forbidden Test",
      meeting_date: "2026-05-12",
      conclusion: "Tidak boleh lolos",
    }),
  });
  const forbiddenMeetingPayload = await forbiddenMeetingCreate.json();

  assert.equal(forbiddenMeetingCreate.status, 403);
  assert.equal(forbiddenMeetingPayload.success, false);
});

test("POST /surveys allows auditor role", async () => {
  const token = await loginAs("auditor@spmi.local");
  const response = await fetch(`${baseUrl}/surveys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Survei Audit",
      target: "dosen",
      status: "draft",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.title, "Survei Audit");
});

test("POST /hris resources creates position, competency, and document", async () => {
  const token = await loginAs("admin@spmi.local");

  const positionResponse = await fetch(`${baseUrl}/hris/positions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Kepala Biro SDM",
      holder: "Bagas Mahendra",
      unit: "Biro SDM",
      period: "2026-2030",
      status: "Aktif",
    }),
  });
  const positionPayload = await positionResponse.json();

  const competencyResponse = await fetch(`${baseUrl}/hris/competencies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      employee: "Dr. Anindya Pratama",
      category: "Sertifikasi",
      name: "Sertifikasi Auditor Mutu Internal",
      year: 2026,
      status: "Tervalidasi",
    }),
  });
  const competencyPayload = await competencyResponse.json();

  const documentResponse = await fetch(`${baseUrl}/hris/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      employee: "Dr. Anindya Pratama",
      type: "SK Jabatan",
      title: "SK Kaprodi Sistem Informasi",
      status: "Valid",
    }),
  });
  const documentPayload = await documentResponse.json();

  assert.equal(positionResponse.status, 201);
  assert.equal(positionPayload.success, true);
  assert.equal(positionPayload.data.title, "Kepala Biro SDM");

  assert.equal(competencyResponse.status, 201);
  assert.equal(competencyPayload.success, true);
  assert.equal(competencyPayload.data.name, "Sertifikasi Auditor Mutu Internal");

  assert.equal(documentResponse.status, 201);
  assert.equal(documentPayload.success, true);
  assert.equal(documentPayload.data.title, "SK Kaprodi Sistem Informasi");
});

test("GET /hris/employees/:id returns related HRIS profile", async () => {
  const response = await fetch(`${baseUrl}/hris/employees/EMP-001`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.employee.name, "Dr. Anindya Pratama");
  assert.ok(payload.data.positions.length >= 1);
  assert.ok(payload.data.competencies.length >= 1);
  assert.ok(payload.data.documents.length >= 1);
});

test("PUT /hris resources updates HRIS records", async () => {
  const token = await loginAs("admin@spmi.local");

  const employeeResponse = await fetch(`${baseUrl}/hris/employees/EMP-003`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Bagas Mahendra",
      employeeNumber: "HR-2021-014",
      nidn: "-",
      type: "Tendik",
      status: "Cuti",
      unit: "Biro SDM",
      position: "Staff SDM",
      functionalPosition: "-",
      education: "S1 Manajemen",
      email: "bagas@junrejoindah.ac.id",
    }),
  });
  const employeePayload = await employeeResponse.json();

  const positionResponse = await fetch(`${baseUrl}/hris/positions/POS-3`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Koordinator SDM",
      holder: "Bagas Mahendra",
      unit: "Biro SDM",
      period: "2026",
      status: "Aktif",
    }),
  });
  const positionPayload = await positionResponse.json();

  const competencyResponse = await fetch(`${baseUrl}/hris/competencies/CMP-1`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      employee: "Dr. Anindya Pratama",
      category: "Sertifikasi",
      name: "Sertifikasi Pendidik Nasional",
      year: 2024,
      status: "Tervalidasi",
    }),
  });
  const competencyPayload = await competencyResponse.json();

  const documentResponse = await fetch(`${baseUrl}/hris/documents/DOC-HR-2`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      employee: "Maya Saraswati, M.Kom.",
      type: "Sertifikat",
      title: "Sertifikat Pendidik",
      status: "Valid",
    }),
  });
  const documentPayload = await documentResponse.json();

  assert.equal(employeeResponse.status, 200);
  assert.equal(employeePayload.data.status, "Cuti");
  assert.equal(positionResponse.status, 200);
  assert.equal(positionPayload.data.title, "Koordinator SDM");
  assert.equal(competencyResponse.status, 200);
  assert.equal(competencyPayload.data.name, "Sertifikasi Pendidik Nasional");
  assert.equal(documentResponse.status, 200);
  assert.equal(documentPayload.data.status, "Valid");
});

test("HRIS documents support upload and HRIS records can be deleted", async () => {
  const token = await loginAs("admin@spmi.local");

  const documentForm = new FormData();
  documentForm.append("employee", "Dr. Anindya Pratama");
  documentForm.append("type", "SK Jabatan");
  documentForm.append("title", "SK Penguji Mutu Internal");
  documentForm.append("status", "Valid");
  documentForm.append("file", new Blob(["mock pdf"], { type: "application/pdf" }), "sk-penguji.pdf");

  const documentResponse = await fetch(`${baseUrl}/hris/documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: documentForm,
  });
  const documentPayload = await documentResponse.json();

  assert.equal(documentResponse.status, 201);
  assert.equal(documentPayload.success, true);
  assert.equal(documentPayload.data.fileName, "sk-penguji.pdf");
  assert.ok(documentPayload.data.filePath);

  const positionResponse = await fetch(`${baseUrl}/hris/positions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: "Reviewer Dokumen Mutu",
      holder: "Dr. Anindya Pratama",
      unit: "LPM",
      period: "2026",
      status: "Aktif",
    }),
  });
  const positionPayload = await positionResponse.json();

  const competencyResponse = await fetch(`${baseUrl}/hris/competencies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      employee: "Dr. Anindya Pratama",
      category: "Pelatihan",
      name: "Workshop Dokumen Mutu",
      year: 2026,
      status: "Tervalidasi",
    }),
  });
  const competencyPayload = await competencyResponse.json();

  const employeeResponse = await fetch(`${baseUrl}/hris/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: "Pegawai Hapus HRIS",
      employeeNumber: "HR-DEL-001",
      nidn: "-",
      type: "Tendik",
      status: "Aktif",
      unit: "Biro SDM",
      position: "Staff Arsip",
      functionalPosition: "-",
      education: "S1",
      email: "hapus.hris@junrejoindah.ac.id",
    }),
  });
  const employeePayload = await employeeResponse.json();

  const deleteDocument = await fetch(`${baseUrl}/hris/documents/${documentPayload.data.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const deletePosition = await fetch(`${baseUrl}/hris/positions/${positionPayload.data.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const deleteCompetency = await fetch(`${baseUrl}/hris/competencies/${competencyPayload.data.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const deleteEmployee = await fetch(`${baseUrl}/hris/employees/${employeePayload.data.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(deleteDocument.status, 200);
  assert.equal(deletePosition.status, 200);
  assert.equal(deleteCompetency.status, 200);
  assert.equal(deleteEmployee.status, 200);
});

test("POST /imports allows admin role only", async () => {
  const adminToken = await loginAs("admin@spmi.local");
  const unitToken = await loginAs("unit@spmi.local");

  const okResponse = await fetch(`${baseUrl}/imports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: (() => {
      const form = new FormData();
      form.append("type", "lkpt");
      form.append("title", "Import Admin");
      form.append("file_name", "admin-import.xlsx");
      return form;
    })(),
  });
  const okPayload = await okResponse.json();

  assert.equal(okResponse.status, 201);
  assert.equal(okPayload.success, true);

  const deniedResponse = await fetch(`${baseUrl}/imports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${unitToken}`,
    },
    body: (() => {
      const form = new FormData();
      form.append("type", "lkps");
      form.append("title", "Import Unit");
      form.append("file_name", "unit-import.xlsx");
      return form;
    })(),
  });
  const deniedPayload = await deniedResponse.json();

  assert.equal(deniedResponse.status, 403);
  assert.equal(deniedPayload.success, false);
});

test("integration readiness covers SIAKAD SIMPEG finance repository PDDIKTI and SSO with logs", async () => {
  const adminToken = await loginAs("admin@spmi.local");

  const listResponse = await fetch(`${baseUrl}/integrations`);
  const listPayload = await listResponse.json();

  assert.equal(listResponse.status, 200);
  assert.equal(listPayload.success, true);

  const keys = listPayload.data.map((item) => item.key);
  for (const key of ["siakad", "simpeg", "keuangan", "repository", "pddikti", "sso_iam"]) {
    assert.equal(keys.includes(key), true);
  }

  const readinessResponse = await fetch(`${baseUrl}/integrations/readiness`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const readinessPayload = await readinessResponse.json();

  assert.equal(readinessResponse.status, 200);
  assert.equal(readinessPayload.data.systems.includes("SIAKAD"), true);
  assert.equal(readinessPayload.data.systems.includes("SSO/IAM"), true);

  const checkResponse = await fetch(`${baseUrl}/integrations/siakad/check`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const checkPayload = await checkResponse.json();

  assert.equal(checkResponse.status, 200);
  assert.equal(checkPayload.data.checks.synchronization.record_count > 0, true);
  assert.equal(Boolean(checkPayload.data.log.id), true);

  const syncResponse = await fetch(`${baseUrl}/integrations/repository/sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const syncPayload = await syncResponse.json();

  assert.equal(syncResponse.status, 201);
  assert.equal(Boolean(syncPayload.data.last_sync_at), true);
  assert.equal(Boolean(syncPayload.data.log.metadata.record_count >= 0), true);

  const logsResponse = await fetch(`${baseUrl}/integrations/logs`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const logsPayload = await logsResponse.json();

  assert.equal(logsResponse.status, 200);
  assert.equal(logsPayload.data.length >= 2, true);
});
