const http = require("http");

const baseUrl = process.env.UAT_BASE_URL || "http://127.0.0.1:4000";
const email = process.env.UAT_ADMIN_EMAIL || "admin@spmi.local";
const password = process.env.UAT_ADMIN_PASSWORD || "Password123!";
const mockPort = Number(process.env.UAT_MOCK_SIAKAD_PORT || 4555);
const shouldStartMock = process.env.UAT_START_MOCK_SIAKAD !== "false";
const allowCommit = process.env.UAT_ALLOW_COMMIT === "true" || shouldStartMock;
const expectedMockBaseUrl = `http://127.0.0.1:${mockPort}/api`;

const mockPayload = {
  data: [
    {
      code: "FTEK",
      siakad_code: "FK-TEK",
      name: "Fakultas Teknik",
      type: "fakultas",
      parent_code: null,
      is_active: true,
    },
    {
      code: "TI",
      siakad_code: "55202",
      name: "Teknik Informatika",
      type: "prodi",
      parent_code: "FTEK",
      is_active: true,
    },
    {
      code: "IFX",
      siakad_code: "55299",
      name: "Prodi Nonaktif UAT",
      type: "prodi",
      parent_code: "FTEK",
      is_active: false,
    },
  ],
};

function startMockSiakad() {
  if (!shouldStartMock) return Promise.resolve(null);

  const server = http.createServer((req, res) => {
    if (req.url === "/api/org-units") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(mockPayload));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: "not found" }));
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(mockPort, "127.0.0.1", () => resolve(server));
  });
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  return { response, body };
}

function expect(condition, message, detail) {
  if (!condition) {
    const error = new Error(message);
    error.detail = detail;
    throw error;
  }
}

async function main() {
  let mockServer = null;
  const checks = [];

  try {
    const status = await request("/system/status");
    checks.push(["system status", status.response.status, status.body?.data?.app_mode]);
    expect(status.response.ok, "System status tidak sehat", status.body);
    expect(status.body?.data?.app_mode === "database", "Backend harus APP_MODE=database untuk UAT commit.", status.body?.data);

    mockServer = await startMockSiakad();

    const login = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    checks.push(["login admin", login.response.status, login.body?.message]);
    expect(login.response.ok, "Login admin gagal", login.body);
    const token = login.body?.data?.token;
    expect(token, "Token login tidak ditemukan", login.body);
    const auth = { authorization: `Bearer ${token}` };

    const siakadCheck = await request("/integrations/siakad/check", { headers: auth });
    checks.push(["siakad check", siakadCheck.response.status, siakadCheck.body?.data?.status]);
    expect(siakadCheck.response.ok, "SIAKAD check gagal", siakadCheck.body);
    expect(siakadCheck.body?.data?.status === "online", "SIAKAD harus online untuk UAT database.", siakadCheck.body?.data);
    if (shouldStartMock) {
      expect(
        siakadCheck.body?.data?.base_url === expectedMockBaseUrl,
        `Backend harus diarahkan ke mock SIAKAD ${expectedMockBaseUrl} sebelum start.`,
        siakadCheck.body?.data
      );
    }

    const preview = await request("/integrations/siakad/org-units/preview", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({}),
    });
    checks.push(["siakad preview", preview.response.status, preview.body?.data?.summary]);
    expect(preview.response.ok, "SIAKAD preview gagal", preview.body);
    expect(preview.body?.data?.summary?.conflict === 0, "Preview SIAKAD masih punya konflik.", preview.body?.data?.summary);
    if (shouldStartMock) {
      expect(preview.body?.data?.summary?.incoming === 2, "Preview harus hanya memuat 2 unit aktif.", preview.body?.data?.summary);
    } else {
      expect(preview.body?.data?.summary?.incoming > 0, "Preview SIAKAD asli tidak memuat unit aktif.", preview.body?.data?.summary);
    }

    if (!allowCommit) {
      checks.push(["siakad commit", "skipped", "set UAT_ALLOW_COMMIT=true to apply preview"]);
      console.log(JSON.stringify({ success: true, commit_applied: false, checks }, null, 2));
      return;
    }

    const commit = await request("/integrations/siakad/org-units/commit", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({}),
    });
    checks.push(["siakad commit", commit.response.status, commit.body?.data?.applied?.length]);
    expect(commit.response.ok, "SIAKAD commit gagal", commit.body);
    expect((commit.body?.data?.applied || []).length > 0, "Commit tidak menerapkan unit SIAKAD.", commit.body?.data);

    const orgUnits = await request("/org-units", { headers: auth });
    const unitCodes = (orgUnits.body?.data || []).map((item) => item.code);
    const expectedCodes = shouldStartMock ? ["FTEK", "TI"] : (preview.body?.data?.rows || []).map((row) => row.incoming?.code).filter(Boolean).slice(0, 2);
    checks.push(["org units after commit", orgUnits.response.status, unitCodes.filter((code) => expectedCodes.includes(code))]);
    expect(orgUnits.response.ok, "Org units gagal dibaca setelah commit", orgUnits.body);
    expect(expectedCodes.every((code) => unitCodes.includes(code)), "Org unit hasil commit tidak ditemukan.", { expectedCodes, unitCodes });

    const batches = await request("/integrations/siakad/org-units/batches?limit=3", { headers: auth });
    checks.push(["siakad batches", batches.response.status, Array.isArray(batches.body?.data) ? batches.body.data.length : null]);
    expect(batches.response.ok, "Batch history gagal dibaca.", batches.body);

    console.log(JSON.stringify({ success: true, checks }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ success: false, message: error.message, detail: error.detail, checks }, null, 2));
    process.exitCode = 1;
  } finally {
    if (mockServer) {
      await new Promise((resolve) => mockServer.close(resolve));
    }
  }
}

main();
