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
});

test("POST /standards creates a local standard", async () => {
  const token = await loginAs("admin@spmi.local");
  const response = await fetch(`${baseUrl}/standards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      code: "STD-TEST-01",
      title: "Standar Test",
      category: "pendidikan",
      description: "Uji create standard",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.code, "STD-TEST-01");
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
      score: 88,
      status: "draft",
      finding_summary: "Temuan uji",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.score, 88);
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
