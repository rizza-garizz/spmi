"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import type { AppRole } from "@/lib/spmi-access";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { DataRefreshBridge } from "@/components/layout/data-refresh-bridge";
import { TopbarSession } from "@/components/layout/topbar-session";
import { ErrorBoundary } from "@/components/support/ErrorBoundary";

const navSections: Array<{
  label: string;
  items: Array<{ href: string; icon: string; text: string; roles: AppRole[] }>;
}> = [
  {
    label: "Strategic Dashboard",
    items: [
      { href: "/dashboard", icon: "la-dashboard", text: "Performance Overview", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"] },
      { href: "/nilai", icon: "la-bar-chart", text: "Nilai & Rekap", roles: ["admin_lpm", "auditor", "kaprodi", "sekprodi", "unit_kerja"] },
    ],
  },
  {
    label: "P - Penetapan (Policies)",
    items: [
      { href: "/standards", icon: "la-book", text: "Standar Mutu (IQAS)", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"] },
      { href: "/documents", icon: "la-file-text", text: "Document Repository", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"] },
    ],
  },
  {
    label: "P - Pelaksanaan (Action)",
    items: [
      { href: "/indicators", icon: "la-chart-line", text: "Capaian IKU/IKT", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"] },
      { href: "/ppepp", icon: "la-refresh", text: "PPEPP Tracker", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"] },
    ],
  },
  {
    label: "E - Evaluasi (Evaluation)",
    items: [
      { href: "/ami", icon: "la-check-circle", text: "Audit Mutu Internal", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"] },
      { href: "/surveys", icon: "la-poll", text: "Stakeholder Feedback", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"] },
    ],
  },
  {
    label: "P - Pengendalian (Control)",
    items: [
      { href: "/rtm", icon: "la-users", text: "Mgt Review (RTM)", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"] },
      { href: "/rtl", icon: "la-tasks", text: "RTL Monitoring", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"] },
    ],
  },
  {
    label: "Pengaturan & Integrasi",
    items: [
      { href: "/organization", icon: "la-sitemap", text: "Organization", roles: ["admin_lpm", "dekan", "wakil_dekan"] },
      { href: "/accreditation", icon: "la-graduation-cap", text: "Accreditation", roles: ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"] },
      { href: "/imports", icon: "la-upload", text: "Imports", roles: ["admin_lpm"] },
      { href: "/integrations", icon: "la-plug", text: "Integrations", roles: ["admin_lpm"] },
      { href: "/settings", icon: "la-cog", text: "Akses & Settings", roles: ["admin_lpm"] },
    ],
  },
];

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isPublicReferencePage = pathname === "/access-info";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const roles = useCurrentRoles();

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
                  <h3 style={{ margin: 0, paddingLeft: "15px" }}>SPMI Universitas Junrejo Nusantara</h3>
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
              {navSections.map((section, sectionIndex) => {
                const allowedItems = section.items.filter((item) => hasRoleAccess(item.roles, roles));
                if (allowedItems.length === 0) {
                  return null;
                }

                return (
                  <li key={section.label}>
                    <span className={`nav-label ${sectionIndex === 0 ? "first" : ""}`}>{section.label}</span>
                    <ul className="spmi-nav-sublist">
                      {allowedItems.map((item) => (
                        <li key={item.href}>
                          <a href={item.href}>
                            <i className={`la ${item.icon}`}></i>
                            <span className="nav-text">{item.text}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="content-body">
          <div className="container-fluid">
            <DataRefreshBridge />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
