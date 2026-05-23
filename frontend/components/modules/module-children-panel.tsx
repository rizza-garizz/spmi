"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";
import { findModuleTrail, type ModuleNode } from "@/lib/module-registry";

function filterChildren(nodes: ModuleNode[] = [], roles: ReturnType<typeof useCurrentRoles>) {
  return nodes.filter((node) => hasRoleAccess(node.roles, roles));
}

export function ModuleChildrenPanel() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [activeChildId, setActiveChildId] = useState<string | undefined>();
  const roles = useCurrentRoles();
  const trail = findModuleTrail(`${pathname}${hash}`);
  const current = trail[trail.length - 1];
  const parentForPanel = current?.children?.length ? current : trail[trail.length - 2];
  const children = filterChildren(parentForPanel?.children ?? [], roles);
  const activeChild = children.find((child) => child.id === activeChildId) ?? children.find((child) => child.id === current?.id) ?? children[0];
  const activeGrandChildren = filterChildren(activeChild?.children ?? [], roles);

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    setActiveChildId(children.find((child) => child.id === current?.id)?.id ?? children[0]?.id);
  }, [current?.id, parentForPanel?.id, pathname, hash]);

  if (!parentForPanel || children.length === 0) {
    return null;
  }

  return (
    <section className="module-children-panel" aria-label={`Children ${parentForPanel.label}`}>
      <div className="module-children-menu module-children-menu-parent">
        <a href={parentForPanel.href} className="module-children-menu-title">
          <strong>{parentForPanel.label}</strong>
          <span>{parentForPanel.description}</span>
        </a>
        {children.map((child) => (
          <a
            href={child.href}
            className={`module-children-menu-item ${activeChild?.id === child.id ? "is-active" : ""}`}
            key={child.id}
            onFocus={() => setActiveChildId(child.id)}
            onMouseEnter={() => setActiveChildId(child.id)}
          >
            <span>{child.label}</span>
            <i className="la la-angle-right"></i>
          </a>
        ))}
      </div>
      {activeChild ? (
        <div className="module-children-menu module-children-menu-child">
          <a href={activeChild.href} className="module-children-menu-title">
            <strong>{activeChild.label}</strong>
            <span>{activeChild.description}</span>
          </a>
          {activeGrandChildren.length > 0 ? (
            activeGrandChildren.map((child) => (
              <a href={child.href} className="module-children-menu-item" key={child.id}>
                <span>{child.label}</span>
              </a>
            ))
          ) : (
            <a href={activeChild.href} className="module-children-menu-item">
              <span>Buka {activeChild.label}</span>
            </a>
          )}
        </div>
      ) : null}
    </section>
  );
}
