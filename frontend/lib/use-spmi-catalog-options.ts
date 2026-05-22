"use client";

import { useEffect, useMemo, useState } from "react";
import { clientApiRequest, parseApiPayload } from "@/lib/spmi-session-client";

export type CatalogOrgUnit = {
  code: string;
  name: string;
  type: string;
  parent_code?: string;
};

export type CatalogStandard = {
  id?: number | string;
  code: string;
  title: string;
  category?: string;
};

export type CatalogCycle = {
  id: number | string;
  name: string;
  period?: string;
  status?: string;
};

type CatalogOptions = {
  orgUnits: CatalogOrgUnit[];
  standards: CatalogStandard[];
  ppeppCycles: CatalogCycle[];
  documentTypes: Array<{ value: string; label: string }>;
  importTypes: Array<{ value: string; label: string }>;
  surveyTargets: Array<{ value: string; label: string }>;
  hris?: {
    employees?: Array<{ id: string; name: string; unit?: string; email?: string; type?: string }>;
  };
};

const emptyCatalog: CatalogOptions = {
  orgUnits: [],
  standards: [],
  ppeppCycles: [],
  documentTypes: [],
  importTypes: [],
  surveyTargets: [],
  hris: { employees: [] },
};

export function useSpmiCatalogOptions() {
  const [catalog, setCatalog] = useState<CatalogOptions>(emptyCatalog);

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      try {
        const response = await clientApiRequest("/catalog");
        const payload = await response.json();
        const data = parseApiPayload<CatalogOptions>(payload, emptyCatalog);
        if (!mounted) return;
        setCatalog({
          ...emptyCatalog,
          ...data,
          orgUnits: Array.isArray(data.orgUnits) ? data.orgUnits : [],
          standards: Array.isArray(data.standards) ? data.standards : [],
          ppeppCycles: Array.isArray(data.ppeppCycles) ? data.ppeppCycles : [],
          documentTypes: Array.isArray(data.documentTypes) ? data.documentTypes : [],
          importTypes: Array.isArray(data.importTypes) ? data.importTypes : [],
          surveyTargets: Array.isArray(data.surveyTargets) ? data.surveyTargets : [],
          hris: data.hris ?? { employees: [] },
        });
      } catch {
        if (mounted) setCatalog(emptyCatalog);
      }
    }

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  return useMemo(() => catalog, [catalog]);
}

export function makeNextCode(prefix: string, existingCodes: Array<string | undefined>) {
  const nextNumber =
    existingCodes.reduce((max, code) => {
      const match = String(code || "").match(/(\d+)$/);
      return Math.max(max, match ? Number(match[1]) : 0);
    }, 0) + 1;

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}
