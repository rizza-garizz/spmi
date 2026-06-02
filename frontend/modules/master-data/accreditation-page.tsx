"use client";

import { useEffect, useState } from "react";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";

interface Accreditation {
  id: string;
  faculty_name: string;
  unit_name: string;
  level: string;
  rank: string;
  sk: string;
  instrument: string;
  expiry_date: string;
  certificate_url: string | null;
}

type CatalogFaculty = {
  code: string;
  name: string;
  programs?: Array<{
    name: string;
    level: string;
    accreditation?: {
      rank?: string;
      sk?: string;
      expiry?: string;
      instrument?: string;
      certificate?: string | null;
    };
  }>;
};

export function AccreditationPage() {
  const [data, setData] = useState<Accreditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAccreditation() {
      setLoading(true);
      setError("");

      try {
        const response = await clientApiRequest("/catalog");
        const payload = await response.json();
        const catalog = parseApiPayload<{ faculties?: CatalogFaculty[] }>(payload, { faculties: [] });
        const rows = (catalog.faculties || []).flatMap((faculty) =>
          (faculty.programs || [])
            .filter((program) => program.accreditation)
            .map((program) => ({
              id: `${faculty.code}-${program.name}`,
              faculty_name: faculty.name,
              unit_name: program.name,
              level: program.level,
              rank: program.accreditation?.rank || "-",
              sk: program.accreditation?.sk || "-",
              instrument: program.accreditation?.instrument || "-",
              expiry_date: program.accreditation?.expiry || "",
              certificate_url: program.accreditation?.certificate || null,
            }))
        );

        if (active) {
          setData(rows);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Data akreditasi gagal dimuat.");
          setData([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAccreditation();
    return () => {
      active = false;
    };
  }, []);

  const getDaysLeft = (expiry: string) => {
    const today = new Date();
    const exp = new Date(expiry);
    const diff = exp.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const getRankBadge = (rank: string) => {
    const r = rank.toLowerCase();
    if (r === 'unggul' || r === 'a') return 'badge-success';
    if (r === 'baik sekali' || r === 'b') return 'badge-info';
    return 'badge-warning';
  };

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Accreditation Tracker</h4>
            <p className="mb-0">Monitoring masa berlaku dan peringkat akreditasi program studi.</p>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Status Akreditasi Program Studi</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                {error && <div className="alert alert-outline-danger">{error}</div>}
                <table className="table table-bordered table-responsive-sm">
                  <thead className="thead-primary">
                    <tr>
                      <th>Fakultas</th>
                      <th>Program Studi</th>
                      <th>Jenjang</th>
                      <th>Peringkat</th>
                      <th>Lembaga/Instrumen</th>
                      <th>SK</th>
                      <th>Berlaku Sampai</th>
                      <th>Status Sisa Hari</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="text-center">Memuat...</td></tr>
                    ) : data.length === 0 ? (
                      <tr><td colSpan={9} className="text-center">Data akreditasi belum tersedia.</td></tr>
                    ) : data.map((item) => {
                      const days = getDaysLeft(item.expiry_date);
                      const statusColor = days < 180 ? "text-danger font-w600" : "text-dark";
                      return (
                        <tr key={item.id}>
                          <td>{item.faculty_name}</td>
                          <td>{item.unit_name}</td>
                          <td>{item.level}</td>
                          <td>
                            <span className={`badge ${getRankBadge(item.rank)}`}>
                              {item.rank}
                            </span>
                          </td>
                          <td>{item.instrument}</td>
                          <td>{item.sk}</td>
                          <td>{item.expiry_date}</td>
                          <td>
                            <span className={statusColor}>
                              {days > 0 ? `${days} Hari Lagi` : "Sudah Habis!"}
                              {days < 180 && days > 0 && <i className="la la-warning ms-2 text-warning"></i>}
                            </span>
                          </td>
                          <td>
                            <a
                              href={item.certificate_url || "#"}
                              className={`btn btn-xs btn-outline-primary${!item.certificate_url ? " disabled" : ""}`}
                              aria-disabled={!item.certificate_url}
                            >
                              <i className="la la-download"></i> Sertifikat
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
