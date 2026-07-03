const successStatuses = new Set([
  "ready",
  "valid",
  "selesai",
  "final",
  "aktif",
  "approved",
  "generated",
  "done",
  "closed",
  "resolved",
  "low",
  "verified",
  "database",
  "active",
]);

const warningStatuses = new Set([
  "warning",
  "kuning",
  "berjalan",
  "review",
  "perlu_revisi",
  "revision_required",
  "in_review",
  "needs_attention",
  "todo",
  "in_progress",
  "blocked",
  "mitigating",
  "medium",
  "pending",
  "draft",
  "planned",
]);

export type StatusTone = "success" | "warning" | "danger";

export function normalizeStatus(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function getStatusTone(status: unknown): StatusTone {
  const normalized = normalizeStatus(status);

  if (successStatuses.has(normalized)) return "success";
  if (warningStatuses.has(normalized)) return "warning";
  return "danger";
}

export function statusBadgeClassName(status: unknown) {
  return `badge-${getStatusTone(status)}`;
}

export function statusProgressClassName(status: unknown) {
  return `bg-${getStatusTone(status)}`;
}
