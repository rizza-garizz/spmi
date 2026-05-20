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

export const moduleRegistry: ModuleSection[] = [
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
      },
      {
        id: "nilai",
        label: "Nilai & Rekap",
        href: "/nilai",
        icon: "la-bar-chart",
        description: "Rekap capaian, skor, dan ringkasan evaluasi mutu.",
        roles: operatorRoles,
        status: "active",
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
      },
      {
        id: "ppepp",
        label: "PPEPP Tracker",
        href: "/ppepp",
        icon: "la-refresh",
        description: "Siklus penetapan, pelaksanaan, evaluasi, pengendalian, dan peningkatan.",
        roles: allRoles,
        status: "active",
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
      },
      {
        id: "imports",
        label: "Imports",
        href: "/imports",
        icon: "la-upload",
        description: "Import LKPT, LKPS, KKM, dan migrasi AOA.",
        roles: adminOnly,
        status: "active",
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
      },
    ],
  },
];

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
