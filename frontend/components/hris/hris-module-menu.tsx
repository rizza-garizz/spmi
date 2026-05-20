const hrisMenus = [
  {
    label: "Beranda",
    icon: "la-home",
    href: "#hris-dashboard",
    description: "Ringkasan SDM",
    children: [
      { label: "Ringkasan SDM", href: "#hris-dashboard" },
      { label: "Koneksi SPMI", href: "#hris-spmi" },
    ],
  },
  {
    label: "Master SDM",
    icon: "la-users",
    href: "#hris-pegawai",
    description: "Pegawai dan struktur",
    children: [
      { label: "Master Pegawai", href: "#hris-pegawai" },
      { label: "Jabatan Aktif", href: "#hris-jabatan" },
    ],
  },
  {
    label: "Kompetensi",
    icon: "la-certificate",
    href: "#hris-kompetensi",
    description: "Sertifikasi dan pelatihan",
    children: [
      { label: "Kompetensi Pegawai", href: "#hris-kompetensi" },
      { label: "Sertifikasi Dosen", href: "#hris-kompetensi" },
      { label: "Pelatihan SDM", href: "#hris-kompetensi" },
    ],
  },
  {
    label: "Dokumen",
    icon: "la-folder-open",
    href: "#hris-dokumen",
    description: "Eviden SDM",
    children: [
      { label: "Dokumen SDM", href: "#hris-dokumen" },
      { label: "SK Jabatan", href: "#hris-dokumen" },
      { label: "Sertifikat", href: "#hris-dokumen" },
    ],
  },
  {
    label: "Integrasi",
    icon: "la-link",
    href: "#hris-spmi",
    description: "SPMI dan akreditasi",
    children: [
      { label: "Standar SDM", href: "#hris-spmi" },
      { label: "AMI & Akreditasi", href: "#hris-spmi" },
    ],
  },
];

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
