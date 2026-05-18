import { getCatalogSnapshot } from "@/lib/spmi-catalog-api";
import { NilaiCardGrid } from "@/components/nilai/core";
import { activeRoles, getRoleLabel, getRoleSummary, normalizeRole, routeRules, type AppRole } from "@/lib/spmi-access";

type AccessOverviewProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export async function AccessOverview({ eyebrow, title, description }: AccessOverviewProps) {
  const catalog = await getCatalogSnapshot();
  const accessByRole = activeRoles.reduce<Record<AppRole, string[]>>((acc, role) => {
    acc[role] = [];
    return acc;
  }, {
    admin_lpm: [],
    auditor: [],
    dekan: [],
    wakil_dekan: [],
    kaprodi: [],
    sekprodi: [],
    unit_kerja: [],
    guest: [],
  });

  routeRules.forEach((rule) => {
    rule.roles.forEach((role) => {
      accessByRole[role].push(rule.path);
    });
  });

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-panel">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="hero-copy">{description}</p>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Role Utama</h2>
            <p>Role tertulis diletakkan di sini agar halaman login tetap fokus pada proses masuk.</p>
          </div>
          <div className="section-tag">Access matrix</div>
        </div>
        <NilaiCardGrid
          columns={4}
          items={catalog.roles.map((role) => ({
            key: role.name,
            title: getRoleLabel(role.name),
            lines: [role.scope, getRoleSummary(role.name)],
          }))}
        />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Cakupan Modul</h2>
            <p>Ringkasan ini membantu user melihat menu mana yang akan muncul sesuai role aktifnya.</p>
          </div>
          <div className="section-tag">Menu access</div>
        </div>
        <NilaiCardGrid
          columns={3}
          items={catalog.roles.map((role) => {
            const normalizedRole = normalizeRole(role.name);
            const accessibleRoutes = normalizedRole === "guest" ? [] : accessByRole[normalizedRole];

            return {
              key: `${role.name}-routes`,
              title: getRoleLabel(role.name),
              lines: accessibleRoutes.length > 0
                ? [
                    `Akses ${accessibleRoutes.length} area utama.`,
                    accessibleRoutes.map((path) => path.replace("/", "") || "dashboard").join(" • "),
                  ]
                : ["Belum ada modul yang terpetakan untuk role ini."],
            };
          })}
        />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>User Seed</h2>
            <p>Akun seed ini memudahkan pengujian login dan role-based access control lokal.</p>
          </div>
        </div>
        <NilaiCardGrid
          columns={2}
          items={catalog.seedUsers.map((item) => ({
            key: item.email,
            title: item.name,
            lines: [
              item.email,
              `Role: ${getRoleLabel(item.role)}`,
              "Gunakan akun ini untuk uji login dan role-based access control di environment lokal.",
            ],
          }))}
        />
      </section>
    </main>
  );
}

export async function SettingsPage() {
  return (
    <AccessOverview
      eyebrow="Admin"
      title="Role & Access"
      description="Area ini disiapkan untuk mengelola role, hak akses, dan akun default seed agar pengelolaan dokumen SPMI tetap terkontrol."
    />
  );
}
