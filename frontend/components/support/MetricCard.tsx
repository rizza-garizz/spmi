import type { ReactNode } from "react";
import { StatusBadge } from "@/components/support/StatusBadge";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  description: string;
  status?: string;
};

export function MetricCard({ label, value, description, status }: MetricCardProps) {
  return (
    <div className="card">
      <div className="card-body">
        {status ? <StatusBadge status={status}>{label}</StatusBadge> : <span className="text-muted">{label}</span>}
        <h2 className="mt-3 mb-1">{value}</h2>
        <p className="mb-0">{description}</p>
      </div>
    </div>
  );
}
