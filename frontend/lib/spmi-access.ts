import { readAuthSession } from "@/lib/spmi-session-client";
import { getAllModuleNodes, moduleRegistry } from "@/lib/module-registry";

export type AppRole =
  | "super_admin"
  | "lpm"
  | "admin_lpm"
  | "auditor"
  | "dekan"
  | "wakil_dekan"
  | "kaprodi"
  | "sekprodi"
  | "unit_kerja"
  | "operator"
  | "guest";

type RouteRule = {
  path: string;
  roles: AppRole[];
};

export const activeRoles: AppRole[] = [
  "super_admin",
  "lpm",
  "admin_lpm",
  "auditor",
  "dekan",
  "wakil_dekan",
  "kaprodi",
  "sekprodi",
  "unit_kerja",
  "operator",
];

const roleAlias: Record<string, AppRole> = {
  super_admin: "super_admin",
  superadmin: "super_admin",
  admin: "super_admin",
  lpm: "lpm",
  admin_lpm: "admin_lpm",
  auditor: "auditor",
  dekan: "dekan",
  wadek: "wakil_dekan",
  wakil_dekan: "wakil_dekan",
  kaprodi: "kaprodi",
  sekprodi: "sekprodi",
  unit: "unit_kerja",
  unit_kerja: "unit_kerja",
  operator: "operator",
};

export const rolePresentation: Record<AppRole, { label: string; summary: string }> = {
  super_admin: {
    label: "Super Admin",
    summary: "Mengelola seluruh menu, konfigurasi sistem, integrasi, import, role, dan akses lintas unit.",
  },
  lpm: {
    label: "LPM",
    summary: "Mengelola proses mutu, standar, dokumen, AMI, PPEPP, RTM, akreditasi, dan approval LPM.",
  },
  admin_lpm: {
    label: "Admin / LPM (Legacy)",
    summary: "Role lama yang tetap didukung dan diperlakukan sebagai akses LPM/Super Admin sesuai konteks modul.",
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
  operator: {
    label: "Operator",
    summary: "Melakukan input operasional yang ditugaskan tanpa akses pengaturan sistem atau approval pimpinan.",
  },
  guest: {
    label: "Guest",
    summary: "Belum memiliki sesi aktif di sistem.",
  },
};

export const routeRules: RouteRule[] = getAllModuleNodes().map((node) => ({
  path: node.href,
  roles: node.roles,
}));

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
  if (roles.includes("super_admin")) {
    return true;
  }

  return roles.some((role) => allowedRoles.includes(role));
}

export function canAccessPath(pathname: string, roles: AppRole[] = getCurrentRoles()) {
  if (pathname === "/login" || pathname === "/access-info") {
    return true;
  }

  if (pathname === "/" || pathname === "/dashboard" || pathname === "/news") {
    return roles[0] !== "guest";
  }

  if (pathname.startsWith("/modules/")) {
    const sectionId = pathname.replace("/modules/", "").split("/")[0];
    const section = moduleRegistry.find((item) => item.id === sectionId);
    if (!section) return false;
    return section.children.some((node) => hasRoleAccess(node.roles, roles));
  }

  const rule = routeRules.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  if (!rule) {
    return roles[0] !== "guest";
  }

  return hasRoleAccess(rule.roles, roles);
}
