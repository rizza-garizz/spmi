"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import type { AppRole } from "@/lib/spmi-access";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { moduleRegistry, type ModuleNode } from "@/lib/module-registry";
import { DataRefreshBridge } from "@/components/layout/data-refresh-bridge";
import { TopbarSession } from "@/components/layout/topbar-session";
import { ErrorBoundary } from "@/components/support/ErrorBoundary";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { ModuleChildrenPanel } from "@/components/modules/module-children-panel";

function getHrefPath(href: string) {
  return href.split("#")[0];
}

function filterAllowedNodes(nodes: ModuleNode[], roles: AppRole[]): ModuleNode[] {
  return nodes.filter((node) => hasRoleAccess(node.roles, roles));
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isPublicReferencePage = pathname === "/access-info";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const roles = useCurrentRoles();

  if (isLoginPage || isPublicReferencePage) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  function renderNavItem(item: ModuleNode): React.ReactNode {
    const itemPath = getHrefPath(item.href);
    const isExactActive = itemPath === pathname;
    const isActive = isExactActive || (itemPath !== "/" && pathname.startsWith(`${itemPath}/`));

    return (
      <li key={item.id}>
        <a className={isActive ? "is-active" : ""} href={item.href}>
          <i className={`la ${item.icon}`}></i>
          <span className="nav-text">{item.shortLabel ?? item.label}</span>
        </a>
      </li>
    );
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
              {moduleRegistry.map((section, sectionIndex) => {
                const allowedItems = filterAllowedNodes(section.children, roles);
                if (allowedItems.length === 0) {
                  return null;
                }

                return (
                  <li key={section.label}>
                    <a className={`nav-label ${sectionIndex === 0 ? "first" : ""}`} href={`/modules/${section.id}`}>{section.label}</a>
                    <ul className="spmi-nav-sublist">
                      {allowedItems.map((item) => renderNavItem(item))}
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
            <DynamicBreadcrumb />
            <ModuleChildrenPanel />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
