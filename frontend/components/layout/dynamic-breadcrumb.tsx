"use client";

import { usePathname } from "next/navigation";
import { findModuleTrail } from "@/lib/module-registry";

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/dashboard") {
    return null;
  }

  const trail = findModuleTrail(pathname);
  if (trail.length === 0) {
    return null;
  }

  return (
    <nav className="spmi-dynamic-breadcrumb" aria-label="Jejak halaman">
      <a href="/dashboard">Dashboard</a>
      {trail.map((node, index) => {
        const isLast = index === trail.length - 1;
        return (
          <span className="spmi-breadcrumb-node" key={`${node.id}-${index}`}>
            <i className="la la-angle-right"></i>
            {isLast ? <strong>{node.shortLabel || node.label}</strong> : <a href={node.href}>{node.shortLabel || node.label}</a>}
          </span>
        );
      })}
    </nav>
  );
}
