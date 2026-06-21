#!/usr/bin/env node

const baseUrl = (process.env.BASE_URL || process.env.HEALTH_URL || "").replace(/\/health\/?$/, "").replace(/\/$/, "");
const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
const adminEmail = process.env.ADMIN_EMAIL || "admin@spmi.local";
const adminPassword = process.env.ADMIN_PASSWORD || "Password123!";
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000);

if (!baseUrl) {
  console.error("BASE_URL or HEALTH_URL is required, for example: BASE_URL=https://api.example.ac.id");
  process.exit(1);
}

function withTimeout(promise, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  return promise(controller.signal).finally(() => clearTimeout(timer));
}

async function request(path, options = {}) {
  const response = await withTimeout(
    (signal) => fetch(`${baseUrl}${path}`, { ...options, signal }),
    `${options.method || "GET"} ${path}`
  );
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed with ${response.status}: ${text.slice(0, 300)}`);
  }

  return { response, payload };
}

function assertPayload(label, payload, predicate) {
  if (!predicate(payload)) {
    throw new Error(`${label} returned unexpected payload: ${JSON.stringify(payload).slice(0, 500)}`);
  }
}

async function check(label, fn) {
  try {
    const result = await fn();
    console.log(`[OK] ${label}${result ? `: ${result}` : ""}`);
  } catch (error) {
    console.error(`[FAIL] ${label}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

let token = null;

(async () => {
  console.log(`Production smoke test target: ${baseUrl}`);

  await check("API health", async () => {
    const { payload } = await request("/health");
    assertPayload("health", payload, (body) => body?.success === true && body?.data?.status === "ok");
    return payload.data.status;
  });

  await check("API readiness", async () => {
    const { payload } = await request("/health/ready");
    assertPayload("readiness", payload, (body) => body?.success === true && body?.data?.status === "ready");
    return payload.data.status;
  });

  if (frontendUrl) {
    await check("Frontend reachable", async () => {
      const response = await withTimeout((signal) => fetch(frontendUrl, { signal }), "frontend");
      if (!response.ok) throw new Error(`Frontend failed with ${response.status}`);
      return `${response.status} ${response.headers.get("content-type") || ""}`.trim();
    });
  }

  await check("Admin login", async () => {
    const { payload } = await request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    assertPayload("login", payload, (body) => body?.success === true && body?.data?.token);
    token = payload.data.token;
    return payload.data.mode || "authenticated";
  });

  await check("Authenticated profile", async () => {
    const { payload } = await request("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assertPayload("profile", payload, (body) => body?.success === true && body?.data?.email === adminEmail);
    return payload.data.email;
  });

  await check("Accreditation summary", async () => {
    const { payload } = await request("/accreditation/summary", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assertPayload("accreditation summary", payload, (body) => body?.success === true && body?.data);
    return "loaded";
  });

  await check("Accreditation periods", async () => {
    const { payload } = await request("/accreditation/periods", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assertPayload("accreditation periods", payload, (body) => body?.success === true && Array.isArray(body?.data));
    return `${payload.data.length} period(s)`;
  });

  if (process.exitCode) {
    console.error("Production smoke test failed.");
    process.exit(process.exitCode);
  }

  console.log("Production smoke test passed.");
})();
