import { readAuthSession } from "@/lib/spmi-session-client";

export type AppRole =
  | "admin_lpm"
  | "auditor"
  | "dekan"
  | "wakil_dekan"
  | "kaprodi"
  | "sekprodi"
  | "unit_kerja"
  | "guest";

type RouteRule = {
  path: string;
  roles: AppRole[];
};

export const activeRoles: AppRole[] = [
  "admin_lpm",
  "auditor",
  "dekan",
  "wakil_dekan",
  "kaprodi",
  "sekprodi",
  "unit_kerja",
];

const roleAlias: Record<string, AppRole> = {
  admin: "admin_lpm",
  lpm: "admin_lpm",
  admin_lpm: "admin_lpm",
  auditor: "auditor",
  dekan: "dekan",
  wadek: "wakil_dekan",
  wakil_dekan: "wakil_dekan",
  kaprodi: "kaprodi",
  sekprodi: "sekprodi",
  unit: "unit_kerja",
  unit_kerja: "unit_kerja",
};

export const rolePresentation: Record<AppRole, { label: string; summary: string }> = {
  admin_lpm: {
    label: "Admin / LPM",
    summary: "Mengelola seluruh modul inti, pengaturan akses, standar mutu, dan integrasi sistem.",
  },
  auditor: {
    label: "Auditor",
    summary: "Fokus pada audit mutu internal, evaluasi, temuan, rekomendasi, dan tindak lanjut audit.",
  },
  dekan: {
    label: "Dekan",
    summary: "Memantau mutu di tingkat fakultas, membaca hasil utama, dan mengawal keputusan strategis fakultas.",
  },
  wakil_dekan: {
    label: "Wakil Dekan",
    summary: "Memantau mutu fakultas dan mengoordinasikan tindak lanjut sesuai bidang kerja pimpinan fakultas.",
  },
  kaprodi: {
    label: "Kaprodi",
    summary: "Mengelola mutu program studi, dokumen prodi, indikator, PPEPP, dan tindak lanjut operasional prodi.",
  },
  sekprodi: {
    label: "Sekprodi",
    summary: "Mendukung operasional mutu prodi melalui input data, pembaruan dokumen, dan monitoring harian.",
  },
  unit_kerja: {
    label: "Unit Kerja",
    summary: "Mengelola implementasi unit, unggah dokumen, indikator, dan tindak lanjut operasional unit.",
  },
  guest: {
    label: "Guest",
    summary: "Belum memiliki sesi aktif di sistem.",
  },
};

export const routeRules: RouteRule[] = [
  { path: "/nilai", roles: ["admin_lpm", "auditor", "kaprodi", "sekprodi", "unit_kerja"] },
  { path: "/settings", roles: ["admin_lpm"] },
  { path: "/standards", roles: activeRoles },
  { path: "/organization", roles: ["admin_lpm", "dekan", "wakil_dekan"] },
  { path: "/accreditation", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"] },
  { path: "/integrations", roles: ["admin_lpm"] },
  { path: "/imports", roles: ["admin_lpm"] },
  { path: "/documents", roles: activeRoles },
  { path: "/ppepp", roles: activeRoles },
  { path: "/ami", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"] },
  { path: "/rtm", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"] },
  { path: "/rtl", roles: activeRoles },
  { path: "/indicators", roles: activeRoles },
  { path: "/surveys", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"] },
];

export function normalizeRole(role?: string | null): AppRole {
  if (!role) {
    return "guest";
  }

  return roleAlias[role] || "guest";
}

export function getRoleLabel(role?: string | null) {
  return rolePresentation[normalizeRole(role)].label;
}

export function getRoleSummary(role?: string | null) {
  return rolePresentation[normalizeRole(role)].summary;
}

export function getCurrentRoles(): AppRole[] {
  const session = readAuthSession();
  const roles = (session?.roles || []).map(normalizeRole).filter((role) => role !== "guest");

  return roles.length > 0 ? Array.from(new Set(roles)) : ["guest"];
}

export function hasRoleAccess(allowedRoles: AppRole[], roles: AppRole[] = getCurrentRoles()) {
  return roles.some((role) => allowedRoles.includes(role));
}

export function canAccessPath(pathname: string, roles: AppRole[] = getCurrentRoles()) {
  if (pathname === "/login" || pathname === "/access-info") {
    return true;
  }

  if (pathname === "/" || pathname === "/dashboard" || pathname === "/news") {
    return roles[0] !== "guest";
  }

  const rule = routeRules.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  if (!rule) {
    return roles[0] !== "guest";
  }

  return hasRoleAccess(rule.roles, roles);
}
