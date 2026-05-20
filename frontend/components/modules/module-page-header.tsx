import { findModuleNodeByHref, moduleRegistry, type ModuleNode } from "@/lib/module-registry";

type ModulePageHeaderProps = {
  href?: string;
  node?: ModuleNode;
  title?: string;
  description?: string;
  eyebrow?: string;
};

export function ModulePageHeader({ href, node, title, description, eyebrow = "Module" }: ModulePageHeaderProps) {
  const current = node ?? (href ? findModuleNodeByHref(href) : undefined);
  const heading = title ?? current?.label ?? "SPMI Command Center";
  const copy = description ?? current?.description ?? "Kelola aktivitas penjaminan mutu dalam struktur kerja yang konsisten.";
  const icon = current?.icon ?? "la-layer-group";

  return (
    <div className="module-page-header">
      <div className="module-page-icon">
        <i className={`la ${icon}`}></i>
      </div>
      <div>
        <span>{eyebrow}</span>
        <h1>{heading}</h1>
        <p>{copy}</p>
      </div>
    </div>
  );
}

export function ModuleSectionLanding({ sectionId }: { sectionId: string }) {
  const section = moduleRegistry.find((item) => item.id === sectionId);

  if (!section) {
    return (
      <main>
        <ModulePageHeader title="Modul tidak ditemukan" description="Registry belum memiliki parent module untuk alamat ini." />
      </main>
    );
  }

  return (
    <main>
      <ModulePageHeader title={section.label} description="Pilih child module sesuai pekerjaan yang ingin dibuka." eyebrow="Parent Module" />
      <section className="module-landing-grid">
        {section.children.map((node) => (
          <ModuleLandingCard node={node} key={node.id} />
        ))}
      </section>
    </main>
  );
}

function ModuleLandingCard({ node }: { node: ModuleNode }) {
  return (
    <article className="module-landing-card">
      <div className="module-landing-card-head">
        <span className="module-landing-card-icon"><i className={`la ${node.icon}`}></i></span>
        <span className={`module-status-badge is-${node.status ?? "active"}`}>{node.status ?? "active"}</span>
      </div>
      <h2>{node.label}</h2>
      <p>{node.description}</p>
      {node.children && node.children.length > 0 ? (
        <div className="module-child-list">
          {node.children.slice(0, 5).map((child) => (
            <a href={child.href} key={child.id}>
              <span>{child.label}</span>
              <i className="la la-angle-right"></i>
            </a>
          ))}
        </div>
      ) : null}
      <a className="module-landing-action" href={node.href}>
        Buka Modul
        <i className="la la-arrow-right"></i>
      </a>
    </article>
  );
}
