"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

interface Accreditation {
  id: number;
  unit_name: string;
  rank: string; // Unggul, Baik Sekali, Baik, A, B, C
  instrument: string; // BAN-PT, LAM-TEKNIK, etc.
  expiry_date: string;
  certificate_url: string | null;
}

export function AccreditationPage() {
  const [data, setData] = useState<Accreditation[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data as fallback for now
  const mockData: Accreditation[] = [
    { id: 1, unit_name: "S1 Teknik Informatika", rank: "Unggul", instrument: "LAM-INFOKOM", expiry_date: "2026-12-31", certificate_url: "#" },
    { id: 2, unit_name: "S1 Sistem Informasi", rank: "Baik Sekali", instrument: "LAM-INFOKOM", expiry_date: "2024-08-15", certificate_url: "#" },
    { id: 3, unit_name: "S1 Manajemen", rank: "A", instrument: "BAN-PT", expiry_date: "2025-05-20", certificate_url: "#" },
  ];

  useEffect(() => {
    // Simulating fetch
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);
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
                <table className="table table-bordered table-responsive-sm">
                  <thead className="thead-primary">
                    <tr>
                      <th>Program Studi</th>
                      <th>Peringkat</th>
                      <th>Lembaga/Instrumen</th>
                      <th>Berlaku Sampai</th>
                      <th>Status Sisa Hari</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center">Memuat...</td></tr>
                    ) : data.map((item) => {
                      const days = getDaysLeft(item.expiry_date);
                      const statusColor = days < 180 ? "text-danger font-w600" : "text-dark";
                      return (
                        <tr key={item.id}>
                          <td>{item.unit_name}</td>
                          <td>
                            <span className={`badge ${getRankBadge(item.rank)}`}>
                              {item.rank}
                            </span>
                          </td>
                          <td>{item.instrument}</td>
                          <td>{item.expiry_date}</td>
                          <td>
                            <span className={statusColor}>
                              {days > 0 ? `${days} Hari Lagi` : "Sudah Habis!"}
                              {days < 180 && days > 0 && <i className="la la-warning ms-2 text-warning"></i>}
                            </span>
                          </td>
                          <td>
                            <a href={item.certificate_url || "#"} className="btn btn-xs btn-outline-primary">
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
