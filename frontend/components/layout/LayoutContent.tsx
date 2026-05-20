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

function getHrefPath(href: string) {
  return href.split("#")[0];
}

function filterAllowedNodes(nodes: ModuleNode[], roles: AppRole[]): ModuleNode[] {
  return nodes
    .filter((node) => hasRoleAccess(node.roles, roles))
    .map((node) => ({
      ...node,
      children: node.children ? filterAllowedNodes(node.children, roles) : undefined,
    }));
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isPublicReferencePage = pathname === "/access-info";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const roles = useCurrentRoles();

  if (isLoginPage || isPublicReferencePage) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  function renderNavItem(item: ModuleNode, level = 0): React.ReactNode {
    const hasChildren = Boolean(item.children?.length);
    const itemPath = getHrefPath(item.href);
    const isExactActive = itemPath === pathname;
    const isActive = isExactActive || (itemPath !== "/" && pathname.startsWith(`${itemPath}/`));
    const isOpen = openMenus[item.id] ?? isActive;

    return (
      <li key={item.id} className={hasChildren ? "spmi-nav-has-children" : ""}>
        {hasChildren ? (
          <>
            <button
              type="button"
              className={`spmi-nav-parent ${isActive ? "is-active" : ""}`}
              aria-expanded={isOpen}
              onClick={() => setOpenMenus((current) => ({ ...current, [item.id]: !isOpen }))}
            >
              <i className={`la ${item.icon}`}></i>
              <span className="nav-text">{item.label}</span>
              <i className={`la la-angle-${isOpen ? "up" : "down"} spmi-nav-chevron`}></i>
            </button>
            {isOpen ? (
              <ul className={`spmi-nav-children ${level > 0 ? "is-nested" : ""}`}>
                {item.children?.map((child) => renderNavItem(child, level + 1))}
              </ul>
            ) : null}
          </>
        ) : (
          <a className={[level > 0 ? "spmi-nav-child-link" : "", isActive ? "is-active" : ""].filter(Boolean).join(" ")} href={item.href}>
            <i className={`la ${item.icon}`}></i>
            <span className="nav-text">{item.label}</span>
          </a>
        )}
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
                    <span className={`nav-label ${sectionIndex === 0 ? "first" : ""}`}>{section.label}</span>
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
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
