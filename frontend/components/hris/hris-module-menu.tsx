const hrisMenus = [
  {
    label: "Beranda",
    icon: "la-home",
    href: "/hris",
    description: "Ringkasan SDM",
    children: [
      { label: "Ringkasan SDM", href: "/hris" },
      { label: "Koneksi SPMI", href: "/hris/integrasi-spmi" },
    ],
  },
  {
    label: "Master SDM",
    icon: "la-users",
    href: "/hris/master-sdm",
    description: "Pegawai dan struktur",
    children: [
      { label: "Struktur Master SDM", href: "/hris/master-sdm" },
      { label: "Master Pegawai", href: "/hris/master-sdm/pegawai" },
      { label: "Dosen", href: "/hris/master-sdm/dosen" },
      { label: "Tendik", href: "/hris/master-sdm/tendik" },
      { label: "Dosen Tugas Tambahan", href: "/hris/master-sdm/dosen-tugas-tambahan" },
    ],
  },
  {
    label: "Jabatan",
    icon: "la-user-shield",
    href: "/hris/jabatan",
    description: "Struktur dan penugasan",
    children: [
      { label: "Jabatan Aktif", href: "/hris/jabatan" },
      { label: "Struktural", href: "/hris/jabatan/struktural" },
    ],
  },
  {
    label: "Kompetensi",
    icon: "la-certificate",
    href: "/hris/kompetensi",
    description: "Sertifikasi dan pelatihan",
    children: [
      { label: "Semua Kompetensi", href: "/hris/kompetensi" },
      { label: "Sertifikasi", href: "/hris/kompetensi/sertifikasi" },
      { label: "Pelatihan", href: "/hris/kompetensi/pelatihan" },
    ],
  },
  {
    label: "Dokumen",
    icon: "la-folder-open",
    href: "/hris/dokumen",
    description: "Eviden SDM",
    children: [
      { label: "Semua Dokumen", href: "/hris/dokumen" },
      { label: "SK Jabatan", href: "/hris/dokumen/sk-jabatan" },
      { label: "Sertifikat", href: "/hris/dokumen/sertifikat" },
      { label: "Upload Eviden", href: "/hris/dokumen/upload" },
    ],
  },
  {
    label: "Integrasi",
    icon: "la-link",
    href: "/hris/integrasi-spmi",
    description: "SPMI dan akreditasi",
    children: [
      { label: "Koneksi SPMI", href: "/hris/integrasi-spmi" },
      { label: "Standar SDM", href: "/hris/integrasi-spmi/standar-sdm" },
      { label: "AMI & Akreditasi", href: "/hris/integrasi-spmi/ami-akreditasi" },
    ],
  },
];

export { hrisMenus };

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
              <a className="hris-module-trigger" href={menu.href}>
                <i className={`la ${menu.icon}`}></i>
                <span>{menu.label}</span>
              </a>
              <div className="hris-module-dropdown">
                <div className="hris-module-dropdown-head">
                  <strong>{menu.label}</strong>
                  <span>{menu.description}</span>
                </div>
                <div className="hris-module-dropdown-list">
                  {menu.children.map((child) => (
                    <a href={child.href} key={child.label}>
                      <span>{child.label}</span>
                      <i className="la la-angle-right"></i>
                    </a>
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

export function HrisStructureMap() {
  return (
    <section className="hris-structure-map" id="hris-pegawai">
      <div className="hris-structure-head">
        <div>
          <span>Pilih Area Kerja</span>
          <h4>Mulai dari kebutuhan yang ingin dikerjakan</h4>
        </div>
        <a href="/hris/master-sdm/pegawai">Kelola Data</a>
      </div>
      <div className="hris-structure-grid">
        {hrisMenus.map((menu) => (
          <article className="hris-structure-card" key={menu.label}>
            <div className="hris-structure-parent">
              <span><i className={`la ${menu.icon}`}></i></span>
              <div>
                <strong>{menu.label}</strong>
                <p>{menu.description}</p>
              </div>
            </div>
            <div className="hris-structure-children">
              {menu.children.map((child) => (
                <a href={child.href} key={child.label}>
                  <span>{child.label}</span>
                  <i className="la la-angle-right"></i>
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
