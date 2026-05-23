import type { AppRole } from "@/lib/spmi-access";

export type ModuleNode = {
  id: string;
  label: string;
  shortLabel?: string;
  href: string;
  icon: string;
  description: string;
  roles: AppRole[];
  status?: "active" | "planned" | "discovery";
  children?: ModuleNode[];
};

export type ModuleSection = {
  id: string;
  label: string;
  children: ModuleNode[];
};

const allRoles: AppRole[] = ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi", "unit_kerja"];
const leadershipRoles: AppRole[] = ["admin_lpm", "dekan", "wakil_dekan"];
const qualityRoles: AppRole[] = ["admin_lpm", "auditor", "dekan", "wakil_dekan", "kaprodi", "sekprodi"];
const operatorRoles: AppRole[] = ["admin_lpm", "auditor", "kaprodi", "sekprodi", "unit_kerja"];
const adminOnly: AppRole[] = ["admin_lpm"];

function createLeafChildren(node: ModuleNode): ModuleNode[] {
  const separator = node.href.includes("#") ? "-" : "#";

  return [
    {
      id: `${node.id}-overview`,
      label: "Ringkasan",
      href: `${node.href}${separator}ringkasan`,
      icon: "la-info-circle",
      description: `Ringkasan konteks, status, dan prioritas untuk ${node.label}.`,
      roles: node.roles,
      status: node.status ?? "active",
    },
    {
      id: `${node.id}-data`,
      label: "Data & Input",
      href: `${node.href}${separator}data-input`,
      icon: "la-edit",
      description: `Area input, pembaruan data, dan aktivitas utama ${node.label}.`,
      roles: node.roles,
      status: node.status ?? "active",
    },
    {
      id: `${node.id}-review`,
      label: "Validasi & Riwayat",
      href: `${node.href}${separator}validasi-riwayat`,
      icon: "la-history",
      description: `Validasi, approval, audit trail, dan riwayat perubahan ${node.label}.`,
      roles: node.roles,
      status: node.status ?? "active",
    },
  ];
}

function normalizeModuleNode(node: ModuleNode): ModuleNode {
  const children = node.children?.length
    ? node.children.map((child) => normalizeModuleNode(child))
    : createLeafChildren(node);

  return {
    ...node,
    children,
  };
}

const rawModuleRegistry: ModuleSection[] = [
  {
    id: "strategic-dashboard",
    label: "Strategic Dashboard",
    children: [
      {
        id: "dashboard",
        label: "Performance Overview",
        shortLabel: "Dashboard",
        href: "/dashboard",
        icon: "la-dashboard",
        description: "Ringkasan eksekutif mutu dan performa universitas.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "dashboard-kpi",
            label: "Dashboard KPI Mutu",
            href: "/dashboard#kpi-mutu",
            icon: "la-tachometer-alt",
            description: "Kartu KPI, grafik ketercapaian, dan monitoring indikator.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "dashboard-filter",
            label: "Filter Eksekutif",
            href: "/dashboard#filter-eksekutif",
            icon: "la-filter",
            description: "Filter fakultas, prodi, tahun, dan standar.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "dashboard-export",
            label: "Export KPI",
            href: "/dashboard#export-kpi",
            icon: "la-file-export",
            description: "Export dashboard ke Excel atau PDF.",
            roles: leadershipRoles,
            status: "active",
          },
        ],
      },
      {
        id: "nilai",
        label: "Nilai & Rekap",
        href: "/nilai",
        icon: "la-bar-chart",
        description: "Rekap capaian, skor, dan ringkasan evaluasi mutu.",
        roles: operatorRoles,
        status: "active",
        children: [
          {
            id: "nilai-rekap",
            label: "Rekap Mutu",
            href: "/nilai#rekap-mutu",
            icon: "la-clipboard-list",
            description: "Ringkasan nilai dan status evaluasi.",
            roles: operatorRoles,
            status: "active",
          },
          {
            id: "nilai-prioritas",
            label: "Prioritas Kerja",
            href: "/nilai#prioritas-kerja",
            icon: "la-bullseye",
            description: "Area prioritas untuk tindak lanjut mutu.",
            roles: operatorRoles,
            status: "active",
          },
        ],
      },
      {
        id: "go-live",
        label: "Go-Live Readiness",
        shortLabel: "Go-Live",
        href: "/go-live",
        icon: "la-rocket",
        description: "UAT, backup, monitoring, dan kesiapan pilot sistem.",
        roles: leadershipRoles,
        status: "active",
        children: [
          {
            id: "go-live-uat",
            label: "UAT Checklist",
            href: "/go-live#uat-checklist",
            icon: "la-check-square",
            description: "Checklist UAT LPM, Prodi, Auditor, Unit, dan Pimpinan.",
            roles: leadershipRoles,
            status: "active",
          },
          {
            id: "go-live-ops",
            label: "Operational Readiness",
            href: "/go-live#operational-readiness",
            icon: "la-server",
            description: "Backup database, storage dokumen, dan monitoring server.",
            roles: leadershipRoles,
            status: "active",
          },
        ],
      },
    ],
  },
  {
    id: "penetapan",
    label: "P - Penetapan (Policies)",
    children: [
      {
        id: "standards",
        label: "Standar Mutu (IQAS)",
        shortLabel: "Standar Mutu",
        href: "/standards",
        icon: "la-book",
        description: "Master standar pendidikan, penelitian, PkM, dan standar tambahan.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "standards-list",
            label: "Daftar Standar",
            href: "/standards#daftar-standar",
            icon: "la-list",
            description: "Tabel standar, pencarian, filter, versi, dan revisi.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "standards-create",
            label: "Tambah Standar",
            href: "/standards#tambah-standar",
            icon: "la-plus-circle",
            description: "Tambah standar dengan penomoran otomatis.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "standards-export",
            label: "Export Standar",
            href: "/standards#export-standar",
            icon: "la-file-excel",
            description: "Export daftar standar dan riwayatnya.",
            roles: allRoles,
            status: "active",
          },
        ],
      },
      {
        id: "documents",
        label: "Document Repository",
        shortLabel: "Dokumen SPMI",
        href: "/documents",
        icon: "la-file-text",
        description: "Repository kebijakan, pedoman, standar, dan eviden PPEPP.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "documents-repository",
            label: "Daftar Repository",
            href: "/documents#repository",
            icon: "la-folder-open",
            description: "Pencarian, filter, preview, dan unduh dokumen.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "documents-upload",
            label: "Upload Dokumen",
            href: "/documents#upload-dokumen",
            icon: "la-upload",
            description: "Unggah dokumen baru dengan validasi metadata.",
            roles: operatorRoles,
            status: "active",
          },
          {
            id: "documents-versioning",
            label: "Versi Dokumen",
            href: "/documents#versi-dokumen",
            icon: "la-code-branch",
            description: "Kelola versi dan validasi file duplikat.",
            roles: operatorRoles,
            status: "active",
          },
        ],
      },
    ],
  },
  {
    id: "pelaksanaan",
    label: "P - Pelaksanaan (Action)",
    children: [
      {
        id: "indicators",
        label: "Capaian IKU/IKT",
        shortLabel: "Indikator",
        href: "/indicators",
        icon: "la-chart-line",
        description: "Indikator kinerja utama, target, capaian, dan sumber data.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "indicators-list",
            label: "Daftar Indikator",
            href: "/indicators#daftar-indikator",
            icon: "la-list",
            description: "Pencarian, filter, dan pagination indikator.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "indicators-create",
            label: "Tambah Indikator",
            href: "/indicators#tambah-indikator",
            icon: "la-plus-circle",
            description: "Tambah IKU/IKT dengan standar dan unit pemilik.",
            roles: operatorRoles,
            status: "active",
          },
          {
            id: "indicators-values",
            label: "Input Capaian",
            href: "/indicators#input-capaian",
            icon: "la-keyboard",
            description: "Input nilai capaian dan analisis akar masalah.",
            roles: operatorRoles,
            status: "active",
          },
        ],
      },
      {
        id: "ppepp",
        label: "PPEPP Tracker",
        href: "/ppepp",
        icon: "la-refresh",
        description: "Siklus penetapan, pelaksanaan, evaluasi, pengendalian, dan peningkatan.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "ppepp-cycles",
            label: "Daftar Siklus",
            href: "/ppepp#daftar-siklus",
            icon: "la-sync",
            description: "Monitoring siklus PPEPP lintas unit.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "ppepp-create",
            label: "Buat Siklus",
            href: "/ppepp#buat-siklus",
            icon: "la-plus-circle",
            description: "Membuat siklus PPEPP berdasarkan unit dan tahun akademik.",
            roles: operatorRoles,
            status: "active",
          },
          {
            id: "ppepp-evidence",
            label: "Evidence PPEPP",
            href: "/ppepp#evidence-ppepp",
            icon: "la-paperclip",
            description: "Upload bukti setiap tahap PPEPP.",
            roles: operatorRoles,
            status: "active",
          },
        ],
      },
    ],
  },
  {
    id: "evaluasi",
    label: "E - Evaluasi (Evaluation)",
    children: [
      {
        id: "ami",
        label: "Audit Mutu Internal",
        shortLabel: "AMI",
        href: "/ami",
        icon: "la-check-circle",
        description: "Audit, temuan, rekomendasi, dan status tindak lanjut.",
        roles: qualityRoles,
        status: "active",
        children: [
          {
            id: "ami-schedule",
            label: "Jadwal Audit",
            href: "/ami#jadwal-audit",
            icon: "la-calendar-check",
            description: "Penjadwalan audit dan unit auditee.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "ami-assignment",
            label: "Penugasan Auditor",
            href: "/ami#penugasan-auditor",
            icon: "la-user-check",
            description: "Kelola auditor, jadwal, dan status assignment.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "ami-instrument",
            label: "Instrumen Audit",
            href: "/ami#instrumen-audit",
            icon: "la-tasks",
            description: "Checklist instrumen, skor, dan catatan audit.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "ami-findings",
            label: "Temuan & Verifikasi",
            href: "/ami#temuan-verifikasi",
            icon: "la-search-plus",
            description: "Temuan minor/mayor/observasi, tindak lanjut, dan verifikasi.",
            roles: qualityRoles,
            status: "active",
          },
        ],
      },
      {
        id: "surveys",
        label: "Stakeholder Feedback",
        shortLabel: "Survei",
        href: "/surveys",
        icon: "la-poll",
        description: "Survei pemangku kepentingan untuk input evaluasi mutu.",
        roles: qualityRoles,
        status: "active",
        children: [
          {
            id: "surveys-list",
            label: "Daftar Survei",
            href: "/surveys#daftar-survei",
            icon: "la-list",
            description: "Survei aktif, target responden, dan status.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "surveys-create",
            label: "Buat Survei",
            href: "/surveys#buat-survei",
            icon: "la-plus-circle",
            description: "Membuat survei dengan target dan siklus PPEPP.",
            roles: qualityRoles,
            status: "active",
          },
        ],
      },
    ],
  },
  {
    id: "pengendalian",
    label: "P - Pengendalian (Control)",
    children: [
      {
        id: "rtm",
        label: "Mgt Review (RTM)",
        shortLabel: "RTM",
        href: "/rtm",
        icon: "la-users",
        description: "Rapat tinjauan manajemen dan pengambilan keputusan strategis.",
        roles: qualityRoles,
        status: "active",
        children: [
          {
            id: "rtm-agenda",
            label: "Agenda RTM",
            href: "/rtm#agenda-rtm",
            icon: "la-calendar",
            description: "Daftar rapat, status, dan keputusan RTM.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "rtm-create",
            label: "Jadwalkan RTM",
            href: "/rtm#jadwalkan-rtm",
            icon: "la-plus-circle",
            description: "Membuat agenda RTM baru berbasis siklus dan unit.",
            roles: leadershipRoles,
            status: "active",
          },
          {
            id: "rtm-rtl-detail",
            label: "Detail RTL",
            href: "/rtm#detail-rtl",
            icon: "la-eye",
            description: "Melihat tindak lanjut dari keputusan RTM.",
            roles: qualityRoles,
            status: "active",
          },
        ],
      },
      {
        id: "rtl",
        label: "RTL Monitoring",
        shortLabel: "RTL",
        href: "/rtl",
        icon: "la-tasks",
        description: "Monitoring penugasan dan progres tindak lanjut per unit.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "rtl-monitoring",
            label: "Monitoring RTL",
            href: "/rtl#monitoring-rtl",
            icon: "la-clipboard-check",
            description: "Daftar tindak lanjut, status, PIC, dan deadline.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "rtl-progress",
            label: "Update Progress",
            href: "/rtl#update-progress",
            icon: "la-edit",
            description: "Memperbarui progres, catatan, dan status tindak lanjut.",
            roles: operatorRoles,
            status: "active",
          },
        ],
      },
    ],
  },
  {
    id: "integrasi",
    label: "Pengaturan & Integrasi",
    children: [
      {
        id: "hris",
        label: "HRIS / SDM",
        shortLabel: "HRIS",
        href: "/hris",
        icon: "la-id-card",
        description: "Sumber data SDM untuk SPMI, AMI, dan akreditasi.",
        roles: leadershipRoles,
        status: "active",
        children: [
          {
            id: "hris-overview",
            label: "Ringkasan SDM",
            href: "/hris",
            icon: "la-chart-pie",
            description: "Dashboard SDM dan koneksi mutu.",
            roles: leadershipRoles,
            status: "active",
          },
          {
            id: "hris-master-sdm",
            label: "Master SDM",
            href: "/hris/master-sdm",
            icon: "la-users",
            description: "Pegawai, dosen, tendik, dan tugas tambahan.",
            roles: leadershipRoles,
            status: "active",
            children: [
              {
                id: "hris-master-pegawai",
                label: "Master Pegawai",
                href: "/hris/master-sdm/pegawai",
                icon: "la-user",
                description: "Data induk seluruh pegawai.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-dosen",
                label: "Dosen",
                href: "/hris/master-sdm/dosen",
                icon: "la-chalkboard-teacher",
                description: "Dosen aktif dan status akademiknya.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-tendik",
                label: "Tendik",
                href: "/hris/master-sdm/tendik",
                icon: "la-user-cog",
                description: "Tenaga kependidikan dan unit homebase.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-dosen-tugas-tambahan",
                label: "Dosen Tugas Tambahan",
                href: "/hris/master-sdm/dosen-tugas-tambahan",
                icon: "la-user-plus",
                description: "Dosen dengan jabatan atau penugasan tambahan.",
                roles: leadershipRoles,
                status: "active",
              },
            ],
          },
          {
            id: "hris-jabatan",
            label: "Jabatan",
            href: "/hris/jabatan",
            icon: "la-user-shield",
            description: "Struktur jabatan dan penugasan aktif.",
            roles: leadershipRoles,
            status: "active",
            children: [
              {
                id: "hris-jabatan-struktural",
                label: "Struktural",
                href: "/hris/jabatan/struktural",
                icon: "la-sitemap",
                description: "Jabatan struktural fakultas, prodi, dan unit.",
                roles: leadershipRoles,
                status: "active",
              },
            ],
          },
          {
            id: "hris-kompetensi",
            label: "Kompetensi",
            href: "/hris/kompetensi",
            icon: "la-certificate",
            description: "Sertifikasi, pelatihan, dan kompetensi SDM.",
            roles: leadershipRoles,
            status: "active",
            children: [
              {
                id: "hris-sertifikasi",
                label: "Sertifikasi",
                href: "/hris/kompetensi/sertifikasi",
                icon: "la-award",
                description: "Sertifikasi pendidik dan sertifikat profesional.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-pelatihan",
                label: "Pelatihan",
                href: "/hris/kompetensi/pelatihan",
                icon: "la-graduation-cap",
                description: "Riwayat pelatihan, workshop, dan pengembangan SDM.",
                roles: leadershipRoles,
                status: "active",
              },
            ],
          },
          {
            id: "hris-dokumen",
            label: "Dokumen SDM",
            href: "/hris/dokumen",
            icon: "la-folder-open",
            description: "SK, sertifikat, dan eviden SDM.",
            roles: leadershipRoles,
            status: "active",
            children: [
              {
                id: "hris-sk-jabatan",
                label: "SK Jabatan",
                href: "/hris/dokumen/sk-jabatan",
                icon: "la-file-signature",
                description: "Surat keputusan jabatan dan pengangkatan.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-dokumen-sertifikat",
                label: "Sertifikat",
                href: "/hris/dokumen/sertifikat",
                icon: "la-certificate",
                description: "Sertifikat pendidik dan kompetensi.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-upload-eviden",
                label: "Upload Eviden",
                href: "/hris/dokumen/upload",
                icon: "la-upload",
                description: "Unggah dokumen pendukung data SDM.",
                roles: leadershipRoles,
                status: "active",
              },
            ],
          },
          {
            id: "hris-integrasi-spmi",
            label: "Koneksi SPMI",
            href: "/hris/integrasi-spmi",
            icon: "la-link",
            description: "Pemetaan data HRIS ke standar, AMI, dan akreditasi.",
            roles: leadershipRoles,
            status: "active",
            children: [
              {
                id: "hris-standar-sdm",
                label: "Standar SDM",
                href: "/hris/integrasi-spmi/standar-sdm",
                icon: "la-book",
                description: "Koneksi data SDM ke standar mutu.",
                roles: leadershipRoles,
                status: "active",
              },
              {
                id: "hris-ami-akreditasi",
                label: "AMI & Akreditasi",
                href: "/hris/integrasi-spmi/ami-akreditasi",
                icon: "la-check-double",
                description: "Eviden SDM untuk AMI dan akreditasi.",
                roles: leadershipRoles,
                status: "active",
              },
            ],
          },
        ],
      },
      {
        id: "organization",
        label: "Organization",
        shortLabel: "Organisasi",
        href: "/organization",
        icon: "la-sitemap",
        description: "Unit organisasi, fakultas, program studi, dan struktur.",
        roles: leadershipRoles,
        status: "active",
        children: [
          {
            id: "organization-tree",
            label: "Struktur Unit",
            href: "/organization#struktur-unit",
            icon: "la-sitemap",
            description: "Parent-child unit, fakultas, prodi, dan unit pendukung.",
            roles: leadershipRoles,
            status: "active",
          },
          {
            id: "organization-export",
            label: "Export Organisasi",
            href: "/organization#export-organisasi",
            icon: "la-file-export",
            description: "Export struktur unit dan kode integrasi.",
            roles: leadershipRoles,
            status: "active",
          },
        ],
      },
      {
        id: "accreditation",
        label: "Accreditation",
        shortLabel: "Akreditasi",
        href: "/accreditation",
        icon: "la-graduation-cap",
        description: "Kriteria, dokumen, dan kesiapan akreditasi.",
        roles: qualityRoles,
        status: "active",
        children: [
          {
            id: "accreditation-status",
            label: "Status Akreditasi",
            href: "/accreditation#status-akreditasi",
            icon: "la-award",
            description: "Status, peringkat, masa berlaku, dan instrumen.",
            roles: qualityRoles,
            status: "active",
          },
          {
            id: "accreditation-certificate",
            label: "Sertifikat Akreditasi",
            href: "/accreditation#sertifikat-akreditasi",
            icon: "la-file-certificate",
            description: "Akses dokumen sertifikat akreditasi unit.",
            roles: qualityRoles,
            status: "active",
          },
        ],
      },
      {
        id: "imports",
        label: "Imports",
        href: "/imports",
        icon: "la-upload",
        description: "Import LKPT, LKPS, KKM, dan migrasi AOA.",
        roles: adminOnly,
        status: "active",
        children: [
          {
            id: "imports-upload",
            label: "Upload Import",
            href: "/imports#upload-import",
            icon: "la-upload",
            description: "Upload file LKPT, LKPS, KKM, atau dataset pendukung.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "imports-aoa-preview",
            label: "AOA Preview",
            href: "/imports#aoa-preview",
            icon: "la-eye",
            description: "Preview validasi data sebelum commit migrasi.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "imports-aoa-commit",
            label: "AOA Commit",
            href: "/imports#aoa-commit",
            icon: "la-check-circle",
            description: "Commit data import yang sudah valid.",
            roles: adminOnly,
            status: "active",
          },
        ],
      },
      {
        id: "integrations",
        label: "Integrations",
        shortLabel: "Integrasi",
        href: "/integrations",
        icon: "la-plug",
        description: "Daftar integrasi sistem pendukung SPMI.",
        roles: adminOnly,
        status: "active",
        children: [
          {
            id: "integrations-map",
            label: "System Map",
            href: "/integrations#system-map",
            icon: "la-project-diagram",
            description: "Peta koneksi SIAKAD, SIMPEG, Keuangan, Repository, PDDIKTI, dan SSO.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "integrations-check",
            label: "Readiness Check",
            href: "/integrations#readiness-check",
            icon: "la-heartbeat",
            description: "Cek sinkronisasi, duplicate data, dan error API.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "integrations-log",
            label: "Integration Logs",
            href: "/integrations#integration-logs",
            icon: "la-history",
            description: "Log integrasi dan riwayat sinkronisasi.",
            roles: adminOnly,
            status: "active",
          },
        ],
      },
      {
        id: "settings",
        label: "Akses & Settings",
        shortLabel: "Settings",
        href: "/settings",
        icon: "la-cog",
        description: "Pengaturan akses, role, dan konfigurasi sistem.",
        roles: adminOnly,
        status: "active",
        children: [
          {
            id: "settings-role-access",
            label: "Role Access",
            href: "/settings#role-access",
            icon: "la-user-lock",
            description: "Mapping role, kewenangan menu, dan scope unit.",
            roles: adminOnly,
            status: "active",
          },
          {
            id: "settings-seed-user",
            label: "Seed Users",
            href: "/settings#seed-users",
            icon: "la-users-cog",
            description: "Daftar user awal dan role aktif.",
            roles: adminOnly,
            status: "active",
          },
        ],
      },
      {
        id: "access-info",
        label: "Access Info",
        href: "/access-info",
        icon: "la-info-circle",
        description: "Informasi akses role, sesi, dan bantuan akun.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "access-session",
            label: "Session Info",
            href: "/access-info#session-info",
            icon: "la-user-clock",
            description: "Informasi sesi dan role pengguna aktif.",
            roles: allRoles,
            status: "active",
          },
          {
            id: "access-help",
            label: "Bantuan Akses",
            href: "/access-info#bantuan-akses",
            icon: "la-life-ring",
            description: "Bantuan reset akses dan kontak admin mutu.",
            roles: allRoles,
            status: "active",
          },
        ],
      },
      {
        id: "news",
        label: "Berita & Aktivitas",
        href: "/news",
        icon: "la-newspaper",
        description: "Informasi terbaru, kegiatan, dan pembaruan SPMI.",
        roles: allRoles,
        status: "active",
        children: [
          {
            id: "news-updates",
            label: "Pembaruan Sistem",
            href: "/news#pembaruan-sistem",
            icon: "la-bell",
            description: "Update fitur, kegiatan mutu, dan pengumuman.",
            roles: allRoles,
            status: "active",
          },
        ],
      },
    ],
  },
];

export const moduleRegistry: ModuleSection[] = rawModuleRegistry.map((section) => ({
  ...section,
  children: section.children.map((node) => normalizeModuleNode(node)),
}));

export function flattenModuleNodes(nodes: ModuleNode[]): ModuleNode[] {
  return nodes.flatMap((node) => [node, ...flattenModuleNodes(node.children ?? [])]);
}

export function getAllModuleNodes() {
  return moduleRegistry.flatMap((section) => flattenModuleNodes(section.children));
}

export function findModuleNodeByHref(href: string) {
  return getAllModuleNodes().find((node) => node.href === href);
}

export function findModuleTrail(pathname: string) {
  const trail: ModuleNode[] = [];

  function visit(nodes: ModuleNode[], parents: ModuleNode[]) {
    for (const node of nodes) {
      const currentTrail = [...parents, node];
      if (pathname === node.href) {
        trail.splice(0, trail.length, ...currentTrail);
      }
      visit(node.children ?? [], currentTrail);
    }
  }

  moduleRegistry.forEach((section) => visit(section.children, []));

  if (trail.length > 0) {
    return trail;
  }

  const fallback = getAllModuleNodes()
    .filter((node) => pathname.startsWith(`${node.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return fallback ? [fallback] : [];
}
