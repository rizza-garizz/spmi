"use client";

import Link from "next/link";
import type { Route } from "next";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { moduleRegistry, type ModuleNode } from "@/lib/module-registry";

type EnterpriseModuleWorkspaceProps = {
  node: ModuleNode;
  trail?: ModuleNode[];
  eyebrow?: string;
};

function flattenChildren(nodes: ModuleNode[]): ModuleNode[] {
  return nodes.flatMap((node) => [node, ...flattenChildren(node.children ?? [])]);
}

function routeHref(href: string) {
  return href as Route;
}

function getWorkspaceKpis(node: ModuleNode, children: ModuleNode[]) {
  const flat = flattenChildren(children);
  const active = flat.filter((item) => (item.status ?? "active") === "active").length;
  const planned = flat.filter((item) => item.status === "planned" || item.status === "discovery").length;
  const direct = children.length;

  if (node.id === "hris") {
    return [
      { icon: "la-users", value: direct, label: "Area SDM", trend: "+8%" },
      { icon: "la-user-tie", value: active, label: "Menu Aktif", trend: "+12%" },
      { icon: "la-award", value: Math.max(1, Math.round(active / 2)), label: "Kompetensi", trend: "+6%" },
      { icon: "la-folder-open", value: flat.length, label: "Dokumen SDM", trend: "+10%" },
    ];
  }

  return [
    { icon: "la-layer-group", value: direct, label: "Quick Menu", trend: "+12%" },
    { icon: "la-check-circle", value: active, label: "Layanan Aktif", trend: "+8%" },
    { icon: "la-route", value: flat.length, label: "Alur Kerja", trend: "+15%" },
    { icon: "la-clock", value: planned, label: "Perlu Pantau", trend: planned > 0 ? "+2%" : "0%" },
  ];
}

function getRecentActivities(node: ModuleNode, children: ModuleNode[]) {
  const source = children.slice(0, 4);
  if (source.length === 0) {
    return [
      { time: "Hari ini", title: `${node.label} siap digunakan`, detail: "Workspace aktif dan mengikuti hak akses pengguna." },
    ];
  }

  return source.map((child, index) => ({
    time: index === 0 ? "Baru saja" : `${index + 1} jam lalu`,
    title: child.label,
    detail: child.description,
  }));
}

function getMenuCount(node: ModuleNode) {
  const count = flattenChildren(node.children ?? []).length;
  return count > 0 ? `${count} submenu` : "Siap dibuka";
}

function getSectionForNode(node: ModuleNode) {
  return moduleRegistry.find((section) => section.children.some((child) => child.id === node.id || child.href === node.href));
}

function normalizeBreadcrumbLabel(label: string) {
  return label.replace(/^\d+\s*/, "");
}

export function EnterpriseModuleWorkspace({ node, trail = [], eyebrow = "Workspace Module" }: EnterpriseModuleWorkspaceProps) {
  const roles = useCurrentRoles();
  const children = (node.children ?? []).filter((child) => hasRoleAccess(child.roles, roles));
  const kpis = getWorkspaceKpis(node, children);
  const activities = getRecentActivities(node, children);
  const section = getSectionForNode(node);
  const sectionItem = section && section.id !== node.id ? { label: normalizeBreadcrumbLabel(section.label), href: `/modules/${section.id}` } : null;
  const trailItems = trail
    .filter((item) => item.href !== "/dashboard")
    .map((item) => ({ label: normalizeBreadcrumbLabel(item.shortLabel || item.label), href: item.href }));
  const breadcrumb = [
    { label: "Dashboard", href: "/dashboard" },
    ...(sectionItem ? [sectionItem] : []),
    ...trailItems,
  ].filter((item, index, list) => list.findIndex((candidate) => candidate.href === item.href) === index);

  return (
    <main className="enterprise-workspace" aria-label={`${node.label} Workspace`}>
      <nav className="enterprise-breadcrumb" aria-label="Breadcrumb">
        {breadcrumb.map((item, index) => {
          const isLast = index === breadcrumb.length - 1;
          return (
            <span key={`${item.href}-${index}`}>
              {index > 0 ? <i className="la la-angle-right" aria-hidden="true"></i> : null}
              {isLast ? <strong>{item.label}</strong> : <Link href={routeHref(item.href)}>{item.label}</Link>}
            </span>
          );
        })}
      </nav>

      <section className="enterprise-workspace-hero">
        <div className="enterprise-workspace-icon">
          <i className={`la ${node.icon}`} aria-hidden="true"></i>
        </div>
        <div>
          <span>{eyebrow}</span>
          <h1>{node.label}</h1>
          <p>{node.description}</p>
        </div>
      </section>

      <section className="enterprise-kpi-grid" aria-label="KPI Modul">
        {kpis.map((item) => (
          <article className="enterprise-kpi-card" key={`${item.label}-${item.value}`}>
            <div className="enterprise-kpi-icon">
              <i className={`la ${item.icon}`} aria-hidden="true"></i>
            </div>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <em>{item.trend}</em>
          </article>
        ))}
      </section>

      <section className="enterprise-panel" aria-label="Quick Access Menu">
        <div className="enterprise-section-head">
          <div>
            <span>Quick Access Menu</span>
            <h2>Child Menu</h2>
          </div>
          <Link href={routeHref(node.href)} className="enterprise-text-action">Ringkasan</Link>
        </div>
        <div className="enterprise-card-grid">
          {children.map((child) => (
            <Link href={routeHref(child.href)} className="enterprise-menu-card" key={child.id}>
              <i className={`la ${child.icon}`} aria-hidden="true"></i>
              <strong>{child.label}</strong>
              <span>{child.description}</span>
              <small>{getMenuCount(child)}</small>
              <em>Buka</em>
            </Link>
          ))}
        </div>
      </section>

      <section className="enterprise-workspace-columns">
        <article className="enterprise-panel" aria-label="Aktivitas Terakhir">
          <div className="enterprise-section-head">
            <div>
              <span>Aktivitas Terakhir</span>
              <h2>Update Modul</h2>
            </div>
          </div>
          <div className="enterprise-activity-list">
            {activities.map((activity) => (
              <div className="enterprise-activity-item" key={`${activity.time}-${activity.title}`}>
                <span>{activity.time}</span>
                <strong>{activity.title}</strong>
                <p>{activity.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="enterprise-panel" aria-label="Informasi Pendukung">
          <div className="enterprise-section-head">
            <div>
              <span>Informasi Pendukung</span>
              <h2>Langkah Berikutnya</h2>
            </div>
          </div>
          <p className="enterprise-support-copy">
            Pilih quick menu sesuai pekerjaan. Semua child tetap memakai routing, API, role access, dan workflow yang sudah ada.
          </p>
          <div className="enterprise-quick-actions">
            {children.slice(0, 3).map((child) => (
              <Link href={routeHref(child.href)} key={child.id}>
                <i className={`la ${child.icon}`} aria-hidden="true"></i>
                {child.shortLabel || child.label}
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
