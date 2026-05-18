"use client";

import { useEffect, useState } from "react";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";
import { hasRoleAccess } from "@/lib/spmi-access";
import { useCurrentRoles } from "@/lib/spmi-access-client";

interface OrgUnit {
  id: number;
  parent_id: number | null;
  code: string;
  siakad_code: string | null;
  name: string;
  type: string;
}

export function OrganizationPage() {
  const roles = useCurrentRoles();
  const canEditUnits = hasRoleAccess(["admin_lpm"], roles);
  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const rootUnits = units.filter((unit) => unit.parent_id === null);
  const childrenByParent = units.reduce<Map<number, OrgUnit[]>>((acc, unit) => {
    if (unit.parent_id !== null) {
      const siblings = acc.get(unit.parent_id) || [];
      siblings.push(unit);
      acc.set(unit.parent_id, siblings);
    }
    return acc;
  }, new Map());

  const totals = units.reduce(
    (acc, unit) => {
      acc.total += 1;
      if (unit.type === "fakultas") acc.faculties += 1;
      if (unit.type === "prodi") acc.programs += 1;
      return acc;
    },
    { total: 0, faculties: 0, programs: 0 }
  );

  const getDepth = (unit: OrgUnit) => {
    let depth = 0;
    let current = unit.parent_id ? unitById.get(unit.parent_id) : undefined;

    while (current) {
      depth += 1;
      current = current.parent_id ? unitById.get(current.parent_id) : undefined;
    }

    return depth;
  };

  const flattenTree = (items: OrgUnit[]): OrgUnit[] =>
    items.flatMap((unit) => [unit, ...flattenTree(childrenByParent.get(unit.id) || [])]);

  const orderedUnits = flattenTree(rootUnits);

  const fetchUnits = async () => {
    try {
      const res = await clientApiRequest("/org-units");
      const json = await res.json();
      setUnits(parseApiPayload(json, []));
    } catch {
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  return (
    <>
      <div className="row page-titles mx-0">
        <div className="col-sm-6 p-md-0">
          <div className="welcome-text">
            <h4>Daftar Unit Kerja & Prodi</h4>
            <p className="mb-0">Manajemen struktur organisasi universitas pendukung SPMI.</p>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-1">Total Unit</h5>
              <h2 className="mb-0">{totals.total}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-1">Fakultas</h5>
              <h2 className="mb-0">{totals.faculties}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-1">Program Studi</h5>
              <h2 className="mb-0">{totals.programs}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Pohon Organisasi</h4>
            </div>
            <div className="card-body">
              {loading ? (
                <p className="mb-0">Memuat...</p>
              ) : (
                <div className="list-group">
                  {orderedUnits.map((unit) => {
                    const depth = getDepth(unit);
                    return (
                      <div key={`tree-${unit.id}`} className="list-group-item" style={{ paddingLeft: `${16 + depth * 20}px` }}>
                        <strong>{unit.code}</strong>
                        <div className="text-muted">{unit.name}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Struktur Organisasi Aktif</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-responsive-sm">
                  <thead className="thead-primary">
                    <tr>
                      <th>Kode Internal</th>
                      <th>Kode SIAKAD</th>
                      <th>Nama Unit / Program Studi</th>
                      <th>Level/Tipe</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center">Memuat...</td></tr>
                    ) : orderedUnits.map((unit) => (
                      <tr key={unit.id}>
                        <td><strong>{unit.code}</strong></td>
                        <td><span className="badge badge-light">{unit.siakad_code || "-"}</span></td>
                        <td style={{ paddingLeft: `${12 + getDepth(unit) * 20}px` }}>{unit.name}</td>
                        <td>
                          <span className={`badge badge-${unit.type === 'prodi' ? 'info' : 'primary'}`}>
                            {unit.type.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {canEditUnits ? (
                            <button className="btn btn-xs btn-primary"><i className="la la-pencil"></i> Edit</button>
                          ) : (
                            <span className="text-muted">Read only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {units.length === 0 && !loading && (
                      <tr><td colSpan={5} className="text-center text-muted">Belum ada unit kerja terdaftar.</td></tr>
                    )}
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
