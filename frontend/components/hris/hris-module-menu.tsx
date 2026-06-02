import Link from "next/link";
import type { Route } from "next";
import { findModuleNodeByHref, type ModuleNode } from "@/lib/module-registry";

const hrisRoot = findModuleNodeByHref("/hris");
const hrisMenus = hrisRoot?.children ?? [];

export { hrisMenus };

function routeHref(href: string) {
  return href as Route;
}

export function HrisModuleMenu() {
  return (
    <div className="hris-module-shell">
      <nav className="hris-module-nav" aria-label="Navigasi modul HRIS">
        <div className="hris-module-brand">
          <span>HR</span>
        </div>
        <ul>
          {hrisMenus.map((menu) => (
            <li key={menu.label}>
              <Link className="hris-module-trigger" href={routeHref(menu.href)}>
                <i className={`la ${menu.icon}`}></i>
                <span>{menu.label}</span>
              </Link>
              <div className="hris-module-dropdown">
                <div className="hris-module-dropdown-head">
                  <strong>{menu.label}</strong>
                  <span>{menu.description}</span>
                </div>
                <div className="hris-module-dropdown-list">
                  {(menu.children ?? []).map((child) => (
                    <Link href={routeHref(child.href)} key={child.label}>
                      <span>{child.label}</span>
                      <i className="la la-angle-right"></i>
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function collectLandingItems(root: ModuleNode) {
  return (root.children && root.children.length > 0 ? root.children : [root]).filter((item) => item.href !== root.href || item.children?.length);
}

export function HrisStructureMap({ rootHref = "/hris" }: { rootHref?: string }) {
  const root = findModuleNodeByHref(rootHref) ?? hrisRoot;
  const items = root ? collectLandingItems(root) : hrisMenus;

  return (
    <section className="hris-structure-map" id="hris-pegawai">
      <div className="hris-structure-head">
        <div>
          <span>Parent & Children</span>
          <h4>{root?.label || "Mulai dari kebutuhan yang ingin dikerjakan"}</h4>
          <p>{root?.description}</p>
        </div>
        <Link href={routeHref(items[0]?.href || "/hris/master-sdm/pegawai")}>Buka Child Pertama</Link>
      </div>
      <div className="hris-structure-grid">
        {items.map((menu) => (
          <article className="hris-structure-card" key={menu.label}>
            <div className="hris-structure-parent">
              <span><i className={`la ${menu.icon}`}></i></span>
              <div>
                <strong>{menu.label}</strong>
                <p>{menu.description}</p>
              </div>
            </div>
            <div className="hris-structure-children">
              {(menu.children && menu.children.length > 0 ? menu.children : [menu]).map((child) => (
                <Link href={routeHref(child.href)} key={child.label}>
                  <span>{child.label}</span>
                  <i className="la la-angle-right"></i>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
