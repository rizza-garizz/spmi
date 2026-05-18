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
  const meetingWithAction = meetings.find((item) => Array.isArray(item.actions) && item.actions.length > 0);

  assert.equal(listResponse.status, 200);
  assert.ok(meetingWithAction);

  const action = meetingWithAction.actions[0];
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
