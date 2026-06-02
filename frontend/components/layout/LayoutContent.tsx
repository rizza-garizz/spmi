"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import type { AppRole } from "@/lib/spmi-access";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { findModuleTrail } from "@/lib/module-registry";
import { DataRefreshBridge } from "@/components/layout/data-refresh-bridge";
import { TopbarSession } from "@/components/layout/topbar-session";
import { ErrorBoundary } from "@/components/support/ErrorBoundary";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { ModuleChildrenPanel } from "@/components/modules/module-children-panel";
import { EnterpriseModuleWorkspace } from "@/components/modules/enterprise-module-workspace";

function getHrefPath(href: string) {
  return href.split("#")[0];
}

function routeHref(href: string) {
  return href as Route;
}

type MegaChild = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  roles: AppRole[];
  children?: MegaChild[];
};

type MegaParent = {
  id: string;
  label: string;
  description: string;
  icon: string;
  children: MegaChild[];
};

const roleAll: AppRole[] = ["super_admin", "lpm", "admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja", "operator"];
const roleQuality: AppRole[] = ["super_admin", "lpm", "admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"];
const roleOperator: AppRole[] = ["super_admin", "lpm", "admin_lpm", "kaprodi", "sekprodi", "unit_kerja", "operator"];
const roleAdmin: AppRole[] = ["super_admin", "admin_lpm"];

const megaParents: MegaParent[] = [
  {
    id: "master-data",
    label: "MASTER DATA & SUMBER DATA",
    description: "Pengelolaan sumber data utama sistem mutu.",
    icon: "la-database",
    children: [
      {
        id: "organization",
        label: "Organisasi",
        description: "Struktur unit, fakultas, program studi, dan unit kerja.",
        href: "/organization",
        icon: "la-sitemap",
        roles: ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"],
        children: [
          { id: "organization-structure", label: "Struktur Unit", description: "Fakultas, prodi, lembaga, dan unit kerja.", href: "/organization#struktur-unit", icon: "la-project-diagram", roles: ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"] },
          { id: "organization-scope", label: "Scope Data", description: "Cakupan data per unit dan role.", href: "/organization#scope-data", icon: "la-filter", roles: ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"] },
        ],
      },
      {
        id: "hris",
        label: "HRIS",
        description: "Data SDM, kompetensi, jabatan, dan dokumen SDM.",
        href: "/hris",
        icon: "la-id-card",
        roles: ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"],
        children: [
          { id: "hris-overview", label: "Ringkasan SDM", description: "KPI dosen, tendik, kompetensi, dan dokumen.", href: "/hris", icon: "la-chart-pie", roles: ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"] },
          { id: "hris-master-sdm", label: "Master SDM", description: "Pegawai, dosen, tendik, dan tugas tambahan.", href: "/hris/master-sdm", icon: "la-users", roles: ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"] },
          { id: "hris-jabatan", label: "Jabatan", description: "Jabatan struktural dan periode aktif.", href: "/hris/jabatan", icon: "la-briefcase", roles: ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"] },
          { id: "hris-kompetensi", label: "Kompetensi", description: "Sertifikasi, pelatihan, dan validasi kompetensi.", href: "/hris/kompetensi", icon: "la-certificate", roles: ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"] },
          { id: "hris-dokumen", label: "Dokumen SDM", description: "SK jabatan, sertifikat, dan evidence SDM.", href: "/hris/dokumen", icon: "la-folder", roles: ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"] },
          { id: "hris-integrasi-spmi", label: "Koneksi SPMI", description: "Pemetaan HRIS ke standar, AMI, dan akreditasi.", href: "/hris/integrasi-spmi", icon: "la-link", roles: ["super_admin", "lpm", "admin_lpm", "dekan", "wakil_dekan"] },
        ],
      },
      { id: "access-info", label: "Access Info", description: "Informasi role, cakupan akses, dan panduan sesi.", href: "/access-info", icon: "la-user-shield", roles: roleAll },
    ],
  },
  {
    id: "penetapan-standar",
    label: "PENETAPAN STANDAR",
    description: "Pengelolaan standar mutu dan dokumen mutu.",
    icon: "la-clipboard-check",
    children: [
      {
        id: "standards",
        label: "Standar Mutu",
        description: "Kelola standar mutu institusi.",
        href: "/standards",
        icon: "la-book",
        roles: roleAll,
        children: [
          { id: "standards-list", label: "Daftar Standar", description: "Standar aktif dan status versi.", href: "/standards#daftar-standar", icon: "la-list", roles: roleAll },
          { id: "standards-version", label: "Riwayat Revisi", description: "Versi, revisi, dan catatan perubahan.", href: "/standards#riwayat-revisi", icon: "la-code-branch", roles: roleQuality },
          { id: "standards-approval", label: "Approval Standar", description: "Review dan validasi standar mutu.", href: "/standards#approval", icon: "la-check-circle", roles: roleQuality },
        ],
      },
      {
        id: "documents",
        label: "Dokumen SPMI",
        description: "Kelola SOP, Manual Mutu, formulir, dan evidence.",
        href: "/documents",
        icon: "la-folder-open",
        roles: roleAll,
        children: [
          { id: "documents-repository", label: "Repository", description: "Manual mutu, SOP, formulir, dan evidence.", href: "/documents#repository", icon: "la-archive", roles: roleAll },
          { id: "documents-upload", label: "Upload Dokumen", description: "Unggah dokumen dan metadata mutu.", href: "/documents#upload-dokumen", icon: "la-upload", roles: roleOperator },
          { id: "documents-version", label: "Versi Dokumen", description: "Riwayat versi dan preview dokumen.", href: "/documents#versi-dokumen", icon: "la-history", roles: roleAll },
        ],
      },
      { id: "sasaran-mutu", label: "Sasaran Mutu", description: "Kelola sasaran dan target mutu terkait standar.", href: "/indicators#sasaran-mutu", icon: "la-bullseye", roles: roleOperator },
    ],
  },
  {
    id: "pelaksanaan-capaian",
    label: "PELAKSANAAN & CAPAIAN",
    description: "Pemantauan indikator, IKU, IKT, dan capaian pelaksanaan.",
    icon: "la-play-circle",
    children: [
      { id: "indicators", label: "Indikator", description: "Kelola indikator mutu dan target capaian.", href: "/indicators", icon: "la-chart-line", roles: roleAll },
      { id: "iku", label: "IKU", description: "Monitoring indikator kinerja utama.", href: "/indicators#iku", icon: "la-tachometer-alt", roles: roleAll },
      { id: "ikt", label: "IKT", description: "Monitoring indikator kinerja tambahan.", href: "/indicators#ikt", icon: "la-chart-bar", roles: roleAll },
      { id: "capaian", label: "Capaian", description: "Input dan evaluasi capaian per periode.", href: "/indicators#input-capaian", icon: "la-check-circle", roles: roleOperator },
    ],
  },
  {
    id: "evaluasi",
    label: "EVALUASI",
    description: "Audit, evaluasi diri, dan survei untuk mengukur mutu.",
    icon: "la-search",
    children: [
      {
        id: "ami",
        label: "Audit Mutu Internal",
        description: "Kelola jadwal, instrumen, temuan, dan laporan AMI.",
        href: "/ami",
        icon: "la-clipboard-list",
        roles: roleQuality,
        children: [
          { id: "ami-schedule", label: "Jadwal Audit", description: "Periode, unit auditee, dan auditor.", href: "/ami#jadwal-audit", icon: "la-calendar-check", roles: roleQuality },
          { id: "ami-instrument", label: "Instrumen", description: "Instrumen, skor, dan catatan audit.", href: "/ami#instrumen", icon: "la-clipboard", roles: roleQuality },
          { id: "ami-finding", label: "Temuan", description: "Temuan minor, mayor, dan observasi.", href: "/ami#temuan", icon: "la-exclamation-circle", roles: roleQuality },
          { id: "ami-report", label: "Laporan AMI", description: "Rekap dan laporan audit printable.", href: "/ami#laporan", icon: "la-file-alt", roles: roleQuality },
        ],
      },
      { id: "evaluasi-diri", label: "Evaluasi Diri", description: "Kaji diri berdasarkan bukti dan capaian mutu.", href: "/nilai#evaluasi-diri", icon: "la-file-alt", roles: roleQuality },
      { id: "surveys", label: "Survey", description: "Kelola survei kepuasan dan umpan balik pemangku kepentingan.", href: "/surveys", icon: "la-poll", roles: roleQuality },
    ],
  },
  {
    id: "pengendalian",
    label: "PENGENDALIAN",
    description: "Pengendalian temuan, RTL, dan monitoring perbaikan.",
    icon: "la-sliders-h",
    children: [
      { id: "rtl", label: "RTL", description: "Kelola rencana tindak lanjut lintas unit.", href: "/rtl", icon: "la-tasks", roles: roleAll },
      { id: "temuan", label: "Temuan", description: "Tinjau temuan audit dan sumber pengendalian.", href: "/ami#temuan", icon: "la-exclamation-circle", roles: roleQuality },
      { id: "monitoring-rtl", label: "Monitoring RTL", description: "Pantau status, PIC, deadline, dan progres RTL.", href: "/rtl#monitoring-rtl", icon: "la-clipboard-check", roles: roleAll },
    ],
  },
  {
    id: "peningkatan",
    label: "PENINGKATAN",
    description: "Program peningkatan mutu, RTM, dan action plan.",
    icon: "la-level-up-alt",
    children: [
      { id: "rtm", label: "RTM", description: "Rapat tinjauan manajemen dan keputusan strategis.", href: "/rtm", icon: "la-users-cog", roles: roleQuality },
      { id: "program-peningkatan", label: "Program Peningkatan", description: "Prioritas peningkatan dari hasil evaluasi dan pengendalian.", href: "/nilai#prioritas-kerja", icon: "la-rocket", roles: roleAll },
      { id: "action-plan", label: "Action Plan", description: "Rencana aksi peningkatan dan siklus berikutnya.", href: "/rtl#action-plan", icon: "la-route", roles: roleOperator },
    ],
  },
  {
    id: "pelaporan",
    label: "PELAPORAN",
    description: "Dashboard, PPEPP, akreditasi, dan analitik pimpinan.",
    icon: "la-chart-pie",
    children: [
      { id: "dashboard", label: "Dashboard", description: "KPI, grafik, counter, dan ringkasan eksekutif.", href: "/dashboard", icon: "la-dashboard", roles: roleAll },
      { id: "ppepp", label: "PPEPP", description: "Siklus, tahapan, evidence, dan capaian PPEPP.", href: "/ppepp", icon: "la-sync", roles: roleAll },
      { id: "accreditation", label: "Akreditasi", description: "Status akreditasi, sertifikat, dan masa berlaku.", href: "/accreditation", icon: "la-award", roles: roleQuality },
      { id: "analytics", label: "Analitik", description: "Analisis performa, tren, dan kesiapan mutu.", href: "/dashboard#analitik", icon: "la-chart-area", roles: roleAll },
    ],
  },
  {
    id: "administrasi",
    label: "ADMINISTRASI",
    description: "User, role, audit trail, dan pengaturan sistem.",
    icon: "la-cog",
    children: [
      { id: "users", label: "User", description: "Kelola pengguna dan sesi akses sistem.", href: "/settings#user", icon: "la-user", roles: roleAdmin },
      { id: "roles", label: "Role", description: "Kelola role, scope, dan hak akses.", href: "/settings#role", icon: "la-user-lock", roles: roleAdmin },
      { id: "audit-trail", label: "Audit Trail", description: "Pantau aktivitas login, CRUD, approval, dan reject.", href: "/settings#audit-trail", icon: "la-history", roles: roleAdmin },
      {
        id: "settings",
        label: "Pengaturan Sistem",
        description: "Konfigurasi sistem, integrasi, dan operasional.",
        href: "/settings",
        icon: "la-tools",
        roles: roleAdmin,
        children: [
          { id: "settings-general", label: "Konfigurasi Umum", description: "Identitas institusi dan tahun akademik.", href: "/settings#konfigurasi-umum", icon: "la-sliders-h", roles: roleAdmin },
          { id: "settings-integration", label: "Integrasi", description: "Status koneksi dan sinkronisasi data.", href: "/integrations", icon: "la-plug", roles: roleAdmin },
          { id: "settings-import", label: "Import Data", description: "Import dan validasi data operasional.", href: "/imports", icon: "la-file-import", roles: roleAdmin },
        ],
      },
    ],
  },
];

function filterMegaChildByRole(child: MegaChild, roles: AppRole[]): MegaChild | null {
  if (!hasRoleAccess(child.roles, roles)) {
    return null;
  }

  const children = child.children
    ?.map((item) => filterMegaChildByRole(item, roles))
    .filter((item): item is MegaChild => Boolean(item));

  return {
    ...child,
    ...(children?.length ? { children } : { children: undefined }),
  };
}

function collectMegaPaths(children: MegaChild[]): string[] {
  return children.flatMap((child) => [getHrefPath(child.href), ...collectMegaPaths(child.children || [])]);
}

function routeMatchesPaths(pathname: string, paths: string[]) {
  return paths.some((path) => path === pathname || (path !== "/" && pathname.startsWith(`${path}/`)));
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isPublicReferencePage = pathname === "/access-info";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hash, setHash] = useState("");
  const [openParentId, setOpenParentId] = useState<string | null>(null);
  const [openChildId, setOpenChildId] = useState<string | null>(null);
  const [focusedChildIndex, setFocusedChildIndex] = useState(0);
  const roles = useCurrentRoles();

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  const trail = useMemo(() => findModuleTrail(pathname), [pathname]);
  const currentNode = trail[trail.length - 1];
  const shouldShowParentWorkspace = Boolean(!hash && currentNode?.children?.length && hasRoleAccess(currentNode.roles, roles));
  const shouldShowModuleChildrenPanel = Boolean(!hash && !shouldShowParentWorkspace);
  const sidebarParents = useMemo(
    () =>
      megaParents
        .map((parent) => ({
          ...parent,
          children: parent.children
            .map((child) => filterMegaChildByRole(child, roles))
            .filter((child): child is MegaChild => Boolean(child)),
        }))
        .filter((parent) => parent.children.length > 0),
    [roles]
  );
  const sidebarParentPaths = useMemo(
    () => new Map(sidebarParents.map((parent) => [parent.id, collectMegaPaths(parent.children)])),
    [sidebarParents]
  );
  const sidebarChildPaths = useMemo(() => {
    const paths = new Map<string, string[]>();

    sidebarParents.forEach((parent) => {
      parent.children.forEach((child) => {
        paths.set(`${parent.id}:${child.id}`, [getHrefPath(child.href), ...collectMegaPaths(child.children || [])]);
      });
    });

    return paths;
  }, [sidebarParents]);
  const activeParentId = useMemo(
    () => sidebarParents.find((parent) => routeMatchesPaths(pathname, sidebarParentPaths.get(parent.id) || []))?.id || null,
    [pathname, sidebarParents, sidebarParentPaths]
  );

  function openMegaMenu(parentId: string, resetChild = false) {
    setOpenParentId((currentParentId) => {
      if (currentParentId !== parentId || resetChild) {
        setOpenChildId(null);
      }

      return parentId;
    });
    setFocusedChildIndex(0);
  }

  function closeMegaMenu() {
    setOpenParentId(null);
    setOpenChildId(null);
  }

  useEffect(() => {
    closeMegaMenu();
  }, [pathname, hash]);

  function handleParentKeyDown(event: KeyboardEvent<HTMLButtonElement>, parentId: string) {
    const parent = sidebarParents.find((item) => item.id === parentId);
    if (!parent) return;

    if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      openMegaMenu(parentId, true);
      requestAnimationFrame(() => {
        const firstChild = document.querySelector<HTMLElement>(`[data-mega-parent="${parentId}"] [data-child-index="0"]`);
        firstChild?.focus();
      });
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMegaMenu();
    }
  }

  function handleChildKeyDown(event: KeyboardEvent<HTMLElement>, parentId: string, childId: string, index: number, total: number, hasChildren: boolean) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = event.key === "ArrowDown" ? (index + 1) % total : (index - 1 + total) % total;
      setFocusedChildIndex(nextIndex);
      document.querySelector<HTMLElement>(`[data-mega-parent="${parentId}"] [data-child-index="${nextIndex}"]`)?.focus();
    }

    if ((event.key === "Enter" || event.key === " ") && hasChildren) {
      event.preventDefault();
      setOpenChildId((current) => (current === childId ? null : childId));
    }

    if (event.key === "ArrowRight") {
      const firstGrandChild = document.querySelector<HTMLAnchorElement>(
        `[data-mega-parent="${parentId}"] [data-child-index="${index}"] ~ .spmi-mega-flyout [data-grand-index="0"]`
      );
      if (firstGrandChild) {
        event.preventDefault();
        setOpenChildId(childId);
        firstGrandChild.focus();
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMegaMenu();
      document.querySelector<HTMLButtonElement>(`[data-parent-trigger="${parentId}"]`)?.focus();
    }
  }

  function handleGrandChildKeyDown(event: KeyboardEvent<HTMLAnchorElement>, parentId: string, childIndex: number, index: number, total: number) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = event.key === "ArrowDown" ? (index + 1) % total : (index - 1 + total) % total;
      document.querySelector<HTMLAnchorElement>(
        `[data-mega-parent="${parentId}"] [data-child-index="${childIndex}"] ~ .spmi-mega-flyout [data-grand-index="${nextIndex}"]`
      )?.focus();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      document.querySelector<HTMLElement>(`[data-mega-parent="${parentId}"] [data-child-index="${childIndex}"]`)?.focus();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMegaMenu();
      document.querySelector<HTMLButtonElement>(`[data-parent-trigger="${parentId}"]`)?.focus();
    }
  }

  if (isLoginPage || isPublicReferencePage) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <div id="main-wrapper" className={["show", sidebarCollapsed ? "menu-toggle" : ""].filter(Boolean).join(" ")}>
        <div className="nav-header">
          <a href="/" className="brand-logo">
            <img className="logo-abbr" src="/envato/images/logo.png" alt="" />
            <img className="logo-compact" src="/envato/images/logo-text.png" alt="" />
            <img className="brand-title" src="/envato/images/logo-text.png" alt="" />
          </a>
          <button
            type="button"
            className="nav-control nav-control-button"
            aria-label={sidebarCollapsed ? "Buka navigasi" : "Tutup navigasi"}
            aria-pressed={sidebarCollapsed}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            <div className={`hamburger ${sidebarCollapsed ? "is-active" : ""}`}>
              <span className="line"></span><span className="line"></span><span className="line"></span>
            </div>
          </button>
        </div>

        <div className="header">
          <div className="header-content">
            <nav className="navbar navbar-expand">
              <div className="collapse navbar-collapse justify-content-between">
                <div className="header-left">
                  <h3 style={{ margin: 0, paddingLeft: "15px" }}>SPMI Universitas Junrejo Indah</h3>
                </div>
                <ul className="navbar-nav header-right">
                  <TopbarSession />
                </ul>
              </div>
            </nav>
          </div>
        </div>

        <div className="dlabnav">
          <div className="dlabnav-scroll">
            <ul className="metismenu" id="menu">
              {sidebarParents.map((parent) => {
                const isActive = activeParentId === parent.id;
                const isOpen = openParentId === parent.id;

                return (
                  <li
                    className={`spmi-parent-nav-item ${isOpen ? "is-expanded" : ""}`}
                    key={parent.id}
                    onMouseEnter={() => openMegaMenu(parent.id)}
                    onMouseLeave={closeMegaMenu}
                    onFocus={() => openMegaMenu(parent.id)}
                  >
                    <button
                      type="button"
                      className={`spmi-parent-nav-row ${isOpen ? "is-open" : ""} ${isActive ? "is-current" : ""}`}
                      aria-haspopup="menu"
                      aria-expanded={isOpen}
                      data-parent-trigger={parent.id}
                      onClick={() => openMegaMenu(parent.id, true)}
                      onKeyDown={(event) => handleParentKeyDown(event, parent.id)}
                    >
                      <span className="spmi-parent-nav-link">
                        <i className={`la ${parent.icon}`}></i>
                        <span className="nav-text">{parent.label}</span>
                      </span>
                      <span className="spmi-parent-nav-toggle" aria-hidden="true">
                        <i className="la la-angle-right"></i>
                      </span>
                    </button>
                    <div
                      className="spmi-mega-panel"
                      role="menu"
                      aria-label={`${parent.label} child menu`}
                      data-mega-parent={parent.id}
                      onMouseEnter={() => openMegaMenu(parent.id)}
                    >
                      <div className="spmi-mega-header">
                        <strong>{parent.label}</strong>
                        <p>{parent.description}</p>
                      </div>
                      <div className="spmi-mega-items">
                        {parent.children.map((child, index) => {
                          const isChildActive = routeMatchesPaths(pathname, sidebarChildPaths.get(`${parent.id}:${child.id}`) || []);
                          const childChildren = child.children || [];
                          const hasChildren = Boolean(child.children?.length);
                          const isChildOpen = openChildId === child.id;
                          return (
                            <div
                              className={`spmi-mega-child-wrap ${hasChildren ? "has-flyout" : ""} ${isChildOpen ? "is-open" : ""}`}
                              key={child.id}
                              onMouseEnter={() => {
                                if (hasChildren) setOpenChildId(child.id);
                              }}
                              onMouseLeave={() => {
                                if (hasChildren) setOpenChildId(null);
                              }}
                            >
                              {hasChildren ? (
                                <button
                                  className={`spmi-mega-child ${isChildActive ? "is-active" : ""}`}
                                  type="button"
                                  role="menuitem"
                                  tabIndex={isOpen && focusedChildIndex === index ? 0 : -1}
                                  data-child-index={index}
                                  aria-haspopup="menu"
                                  aria-expanded={isChildOpen}
                                  onClick={() => setOpenChildId(child.id)}
                                  onFocus={() => {
                                    openMegaMenu(parent.id);
                                    setFocusedChildIndex(index);
                                  }}
                                  onKeyDown={(event) => handleChildKeyDown(event, parent.id, child.id, index, parent.children.length, hasChildren)}
                                >
                                  <i className={`la ${child.icon}`} aria-hidden="true"></i>
                                  <span>
                                    <strong>{child.label}</strong>
                                    <small>{child.description}</small>
                                  </span>
                                  <i className="la la-angle-right spmi-mega-child-arrow" aria-hidden="true"></i>
                                </button>
                              ) : (
                                <Link
                                  className={`spmi-mega-child ${isChildActive ? "is-active" : ""}`}
                                  href={routeHref(child.href)}
                                  role="menuitem"
                                  tabIndex={isOpen && focusedChildIndex === index ? 0 : -1}
                                  data-child-index={index}
                                  onFocus={() => {
                                    openMegaMenu(parent.id);
                                    setFocusedChildIndex(index);
                                  }}
                                  onKeyDown={(event) => handleChildKeyDown(event, parent.id, child.id, index, parent.children.length, hasChildren)}
                                  onClick={closeMegaMenu}
                                >
                                  <i className={`la ${child.icon}`} aria-hidden="true"></i>
                                  <span>
                                    <strong>{child.label}</strong>
                                    <small>{child.description}</small>
                                  </span>
                                </Link>
                              )}
                              {hasChildren ? (
                                <div className="spmi-mega-flyout" role="menu" aria-label={`${child.label} submenu`}>
                                  <div className="spmi-mega-flyout-title">
                                    <strong>{child.label}</strong>
                                    <span>{child.description}</span>
                                  </div>
                                  {childChildren.map((grandChild, grandIndex) => {
                                    const grandPath = getHrefPath(grandChild.href);
                                    const isGrandActive = grandPath === pathname || (grandPath !== "/" && pathname.startsWith(`${grandPath}/`));
                                    return (
                                      <Link
                                        className={`spmi-mega-grandchild ${isGrandActive ? "is-active" : ""}`}
                                        href={routeHref(grandChild.href)}
                                        key={grandChild.id}
                                        role="menuitem"
                                        tabIndex={-1}
                                        data-grand-index={grandIndex}
                                        onKeyDown={(event) =>
                                          handleGrandChildKeyDown(event, parent.id, index, grandIndex, child.children?.length || 0)
                                        }
                                        onClick={closeMegaMenu}
                                      >
                                        <i className={`la ${grandChild.icon}`} aria-hidden="true"></i>
                                        <span>
                                          <strong>{grandChild.label}</strong>
                                          <small>{grandChild.description}</small>
                                        </span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="content-body">
          <div className="container-fluid">
            <DataRefreshBridge />
            {!shouldShowParentWorkspace ? <DynamicBreadcrumb /> : null}
            {shouldShowModuleChildrenPanel ? <ModuleChildrenPanel /> : null}
            <ErrorBoundary>
              {shouldShowParentWorkspace && currentNode ? (
                <EnterpriseModuleWorkspace node={currentNode} trail={trail} />
              ) : (
                children
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
