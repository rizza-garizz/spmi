const baseUrl = process.env.UAT_BASE_URL || "http://127.0.0.1:4000";
const email = process.env.UAT_ADMIN_EMAIL || "admin@spmi.local";
const password = process.env.UAT_ADMIN_PASSWORD || "Password123!";
const runId = process.env.UAT_RUN_ID || new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = {};

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  return { response, body, text };
}

function expect(condition, message, detail) {
  if (!condition) {
    const error = new Error(message);
    error.detail = detail;
    throw error;
  }
}

function label(name) {
  return `${name} ${runId}`;
}

async function main() {
  const checks = [];

  try {
    const health = await request("/health");
    checks.push(["health", health.response.status, health.body?.data?.status]);
    expect(health.response.ok, "Health check gagal", health.body);

    const login = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    checks.push(["login admin", login.response.status, login.body?.data?.mode]);
    expect(login.response.ok, "Login admin gagal", login.body);
    const token = login.body?.data?.token;
    expect(token, "Token login tidak ditemukan", login.body);

    const authHeaders = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    };

    const summary = await request("/accreditation/summary", { headers: authHeaders });
    checks.push(["summary", summary.response.status, summary.body?.data?.metrics?.length]);
    expect(summary.response.ok, "Ringkasan akreditasi gagal dibaca", summary.body);
    expect((summary.body?.data?.criteria || []).length >= 9, "Kriteria akreditasi baseline belum lengkap", summary.body?.data);

    const period = await request("/accreditation/periods", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: label("APS UAT Launch"),
        type: "APS",
        agency: "LAM",
        instrument_id: "INS-002",
        org_unit_code: "SI",
        start_date: "2026-07-01",
        due_date: "2026-12-31",
      }),
    });
    checks.push(["create period", period.response.status, period.body?.data?.id]);
    expect(period.response.status === 201, "Periode akreditasi gagal dibuat", period.body);
    const periodId = period.body.data.id;

    const team = await request("/accreditation/team-members", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        name: label("Reviewer UAT"),
        role: "REVIEWER",
        email: `reviewer.uat.${runId}@spmi.local`,
        responsibility: "Review internal dokumen akreditasi.",
      }),
    });
    checks.push(["create team member", team.response.status, team.body?.data?.id]);
    expect(team.response.status === 201, "Anggota tim gagal dibuat", team.body);

    const task = await request("/accreditation/tasks", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        title: label("Validasi task UAT akreditasi"),
        category: "LKPS",
        assignee: `reviewer.uat.${runId}@spmi.local`,
        priority: "high",
        status: "in_progress",
        due_date: "2026-12-15",
        progress: 45,
        notes: "Task UAT untuk monitoring akreditasi.",
      }),
    });
    checks.push(["create task", task.response.status, task.body?.data?.progress]);
    expect(task.response.status === 201 && task.body?.data?.progress === 45, "Task akreditasi gagal dibuat", task.body);

    const milestone = await request("/accreditation/milestones", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        title: label("Milestone UAT finalisasi LKPS"),
        phase: "lkps",
        owner: `reviewer.uat.${runId}@spmi.local`,
        start_date: "2026-10-01",
        due_date: "2026-11-01",
        status: "in_progress",
        progress: 40,
        notes: "Milestone UAT untuk timeline akreditasi.",
      }),
    });
    checks.push(["create milestone", milestone.response.status, milestone.body?.data?.phase]);
    expect(milestone.response.status === 201, "Milestone gagal dibuat", milestone.body);

    const risk = await request("/accreditation/risks", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        title: label("Risiko UAT keterlambatan bukti"),
        category: "bukti",
        owner: `reviewer.uat.${runId}@spmi.local`,
        probability: 4,
        impact: 4,
        level: "high",
        status: "open",
        mitigation: "Eskalasi ke LPM dan siapkan bukti pengganti.",
        due_date: "2026-11-15",
        notes: "Risk UAT untuk kesiapan submit akreditasi.",
      }),
    });
    checks.push(["create risk", risk.response.status, risk.body?.data?.score]);
    expect(risk.response.status === 201 && risk.body?.data?.score === 16, "Risiko gagal dibuat", risk.body);

    const riskUpdate = await request(`/accreditation/risks/${risk.body.data.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        status: "mitigating",
        probability: 2,
        impact: 3,
        mitigation: "Mitigasi UAT diperbarui dengan fallback bukti dari repository.",
      }),
    });
    checks.push(["update risk", riskUpdate.response.status, riskUpdate.body?.data?.score]);
    expect(riskUpdate.response.ok && riskUpdate.body?.data?.score === 6, "Update risiko gagal", riskUpdate.body);

    const lkps = await request("/accreditation/lkps/entries", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        section_id: "LKPS-SEC-001",
        label: label("Mahasiswa aktif UAT"),
        value: 123,
        unit: "mahasiswa",
        source_module: "SIAKAD",
        status: "draft",
      }),
    });
    checks.push(["create lkps", lkps.response.status, lkps.body?.data?.id]);
    expect(lkps.response.status === 201, "Entry LKPS gagal dibuat", lkps.body);

    const led = await request("/accreditation/led/contents", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        section_id: "LED-SEC-004",
        content: label("Narasi LED UAT untuk pendidikan."),
        status: "draft",
        reviewer_note: "Perlu lampiran LKPS.",
      }),
    });
    checks.push(["create led", led.response.status, led.body?.data?.version]);
    expect(led.response.status === 201, "Konten LED gagal dibuat", led.body);

    const evidence = await request("/accreditation/evidence", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        criteria_code: "K6",
        title: label("Bukti UAT LKPS LED"),
        source_module: "SPMI",
        status: "valid",
        file_name: `bukti-uat-${runId}.pdf`,
        linked_lkps_entry_id: lkps.body.data.id,
        linked_led_content_id: led.body.data.id,
        notes: "Evidence UAT.",
      }),
    });
    checks.push(["create evidence", evidence.response.status, evidence.body?.data?.id]);
    expect(evidence.response.status === 201, "Bukti fisik gagal dibuat", evidence.body);

    const score = await request("/accreditation/self-scores", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        criteria_code: "K1",
        score: 3.25,
        target_score: 3.75,
        status: "warning",
        gap_note: "VMTS perlu bukti monitoring strategi.",
        recommendation: "Tambahkan matriks strategi, indikator, dan evaluasi ketercapaian.",
        reviewer: `reviewer.uat.${runId}@spmi.local`,
      }),
    });
    checks.push(["create self score", score.response.status, score.body?.data?.gap]);
    expect(score.response.status === 201, "Self score gagal dibuat", score.body);

    const actionPlan = await request("/accreditation/action-plans", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        criteria_code: "K1",
        title: label("Rencana UAT tutup gap VMTS"),
        source: "self_score",
        owner: `reviewer.uat.${runId}@spmi.local`,
        priority: "high",
        status: "in_progress",
        target_date: "2026-12-22",
        progress: 35,
        action: "Lengkapi matriks strategi dan bukti monitoring VMTS.",
        expected_output: "Bukti K1 siap review internal.",
        notes: "Action plan UAT akreditasi.",
      }),
    });
    checks.push(["create action plan", actionPlan.response.status, actionPlan.body?.data?.progress]);
    expect(actionPlan.response.status === 201, "Action plan gagal dibuat", actionPlan.body);

    const bulkActionPlan = await request("/accreditation/action-plans/bulk", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        items: [
          {
            period_id: periodId,
            criteria_code: "K1",
            title: label("Rencana UAT tutup gap VMTS"),
            source: "self_score",
            owner: `reviewer.uat.${runId}@spmi.local`,
            priority: "high",
            status: "todo",
            action: "Duplikat rencana yang harus dilewati.",
          },
          {
            period_id: periodId,
            criteria_code: "K2",
            title: label("Rencana UAT bulk tata pamong"),
            source: "self_score",
            owner: `reviewer.uat.${runId}@spmi.local`,
            priority: "medium",
            status: "todo",
            action: "Lengkapi bukti tata pamong.",
          },
        ],
      }),
    });
    checks.push(["bulk action plan", bulkActionPlan.response.status, bulkActionPlan.body?.data?.created_count]);
    expect(bulkActionPlan.response.status === 201, "Bulk action plan gagal", bulkActionPlan.body);

    const actionPlanUpdate = await request(`/accreditation/action-plans/${actionPlan.body.data.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        status: "in_progress",
        progress: 100,
        notes: "Action plan UAT sudah tuntas.",
      }),
    });
    checks.push(["update action plan", actionPlanUpdate.response.status, actionPlanUpdate.body?.data?.status]);
    expect(actionPlanUpdate.response.ok && actionPlanUpdate.body?.data?.status === "done", "Update action plan gagal", actionPlanUpdate.body);

    const review = await request("/accreditation/reviews", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        entity_type: "led",
        entity_id: led.body.data.id,
        reviewer: `reviewer.uat.${runId}@spmi.local`,
        status: "revision_required",
        decision: "revise",
        note: "LED perlu revisi UAT.",
        due_date: "2026-12-20",
      }),
    });
    checks.push(["create review", review.response.status, review.body?.data?.status]);
    expect(review.response.status === 201, "Review gagal dibuat", review.body);

    const periodStatus = await request(`/accreditation/periods/${periodId}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        status: "final",
        progress: 95,
        final_note: "Final UAT.",
      }),
    });
    checks.push(["update period status", periodStatus.response.status, periodStatus.body?.data?.status]);
    expect(periodStatus.response.ok && periodStatus.body?.data?.status === "final", "Status periode gagal diperbarui", periodStatus.body);

    const submissionCheck = await request("/accreditation/submission-checks", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        category: "SUBMIT",
        title: label("Checklist UAT paket submit siap"),
        owner: `reviewer.uat.${runId}@spmi.local`,
        verifier: email,
        status: "verified",
        due_date: "2026-12-24",
        evidence_id: evidence.body.data.id,
        notes: "Checklist submit UAT.",
      }),
    });
    checks.push(["create submission check", submissionCheck.response.status, submissionCheck.body?.data?.status]);
    expect(submissionCheck.response.status === 201, "Checklist submit gagal dibuat", submissionCheck.body);

    const bulkSubmissionCheck = await request("/accreditation/submission-checks/bulk", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        items: [
          {
            period_id: periodId,
            category: "SUBMIT",
            title: label("Checklist UAT paket submit siap"),
            owner: `reviewer.uat.${runId}@spmi.local`,
            verifier: email,
            status: "pending",
            notes: "Checklist duplikat tertutup tidak dihitung karena yang lama verified.",
          },
          {
            period_id: periodId,
            category: "LED",
            title: label("Checklist UAT bulk LED"),
            owner: `reviewer.uat.${runId}@spmi.local`,
            verifier: email,
            status: "pending",
            notes: "Checklist bulk LED UAT.",
          },
          {
            period_id: periodId,
            category: "LED",
            title: label("Checklist UAT bulk LED"),
            owner: `reviewer.uat.${runId}@spmi.local`,
            verifier: email,
            status: "pending",
            notes: "Checklist bulk LED UAT duplikat.",
          },
        ],
      }),
    });
    checks.push(["bulk submission checks", bulkSubmissionCheck.response.status, bulkSubmissionCheck.body?.data?.created_count]);
    expect(bulkSubmissionCheck.response.status === 201, "Bulk checklist submit gagal", bulkSubmissionCheck.body);

    const pendingChecklist = (bulkSubmissionCheck.body?.data?.created || []).find((item) => item.status === "pending");
    expect(pendingChecklist?.id, "Checklist pending tidak ditemukan untuk update", bulkSubmissionCheck.body?.data);

    const submissionCheckUpdate = await request(`/accreditation/submission-checks/${pendingChecklist.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        status: "verified",
        notes: "Checklist bulk sudah diverifikasi.",
      }),
    });
    checks.push(["update submission check", submissionCheckUpdate.response.status, submissionCheckUpdate.body?.data?.status]);
    expect(submissionCheckUpdate.response.ok, "Update checklist submit gagal", submissionCheckUpdate.body);

    const exportPackage = await request("/accreditation/exports", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        period_id: periodId,
        type: "package_manifest",
      }),
    });
    checks.push(["generate export", exportPackage.response.status, exportPackage.body?.data?.id]);
    expect(exportPackage.response.status === 201, "Generate export gagal", exportPackage.body);
    expect(exportPackage.body?.data?.package_summary?.lkps_entries === 1, "Export summary LKPS tidak sesuai", exportPackage.body?.data);
    expect(exportPackage.body?.data?.package_summary?.evidence === 1, "Export summary evidence tidak sesuai", exportPackage.body?.data);

    const download = await request(`/accreditation/exports/${exportPackage.body.data.id}/download`, {
      headers: { authorization: `Bearer ${token}` },
    });
    checks.push(["download export", download.response.status, download.body?.period?.id]);
    expect(download.response.ok, "Download manifest export gagal", download.body);
    expect(download.body?.period?.id === periodId, "Manifest export tidak cocok dengan periode UAT", download.body?.period);
    expect((download.body?.lkps_entries || []).length === 1, "Manifest LKPS tidak lengkap", download.body);
    expect((download.body?.action_plans || []).length >= 2, "Manifest action plans tidak lengkap", download.body);

    console.log(JSON.stringify({ success: true, run_id: runId, period_id: periodId, checks }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ success: false, run_id: runId, message: error.message, detail: error.detail, checks }, null, 2));
    process.exitCode = 1;
  }
}

main();
