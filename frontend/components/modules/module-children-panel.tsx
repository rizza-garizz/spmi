"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { findModuleTrail, type ModuleNode } from "@/lib/module-registry";

function filterChildren(nodes: ModuleNode[] = [], roles: ReturnType<typeof useCurrentRoles>) {
  return nodes.filter((node) => hasRoleAccess(node.roles, roles));
}

function getChildMeta(node: ModuleNode) {
  const childCount = node.children?.length ?? 0;

  if (childCount > 0) {
    return `${childCount} child`;
  }

  return node.href.includes("#") ? "Action" : "Page";
}

export function ModuleChildrenPanel() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const roles = useCurrentRoles();
  const trail = findModuleTrail(`${pathname}${hash}`);
  const current = trail[trail.length - 1];
  const children = filterChildren(current?.children ?? [], roles);

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  if (!current || children.length === 0) {
    return null;
  }

  return (
    <section className="module-children-panel" aria-label={`Children ${current.label}`}>
      <div className="module-children-panel-head">
        <div>
          <span>Struktur Parent & Children Page</span>
          <strong>{current.label}</strong>
          <p>{current.description}</p>
        </div>
        <a href={current.href} className="module-children-parent-link">
          <i className={`la ${current.icon}`}></i>
          Parent
        </a>
      </div>
      <div className="module-children-grid">
        {children.map((child) => (
          <a href={child.href} className="module-child-action-card" key={child.id}>
            <span className="module-child-action-icon">
              <i className={`la ${child.icon}`}></i>
            </span>
            <span>
              <strong>{child.label}</strong>
              <small>{child.description}</small>
            </span>
            <em>{getChildMeta(child)}</em>
            <i className="la la-angle-right"></i>
          </a>
        ))}
      </div>
    </section>
  );
}
