import { getCatalogSnapshot } from "@/lib/spmi-catalog-api";

export async function NewsPage() {
  const catalog = await getCatalogSnapshot();
  const news = (catalog as { news?: any[] }).news || [];

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-panel">
          <span className="eyebrow">Support</span>
          <h1>Berita & Kegiatan</h1>
          <p className="hero-copy">
            Informasi terbaru, kegiatan, dan pembaruan seputar pelaksanaan SPMI di Universitas Junrejo Indah.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Kegiatan SPMI</h2>
            <p>Daftar berita terbaru terkait penjaminan mutu.</p>
          </div>
          <div className="section-tag">Latest news</div>
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
          {news.length > 0 ? (
            news.map((item: any) => (
              <div
                key={item.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "rgba(66, 195, 167, 0.14)",
                        color: "var(--accent)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 12,
                      }}
                    >
                      {item.category}
                    </span>
                    <h3 style={{ fontSize: "1.25rem", lineHeight: 1.4, color: "var(--text)", marginBottom: 8 }}>
                      {item.title}
                    </h3>
                    <p style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                      {item.excerpt}
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  display: "flex", 
                  gap: 16, 
                  alignItems: "center", 
                  marginTop: 8, 
                  paddingTop: 12, 
                  borderTop: "1px solid var(--line)",
                  fontSize: "0.85rem",
                  color: "var(--muted)" 
                }}>
                  <span>📅 {item.date}</span>
                  <span>✍️ {item.author}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ textAlign: "center", padding: 32 }}>
              <p style={{ color: "var(--muted)" }}>Belum ada berita atau kegiatan.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
