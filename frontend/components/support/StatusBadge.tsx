import type { ReactNode } from "react";
import { statusBadgeClassName } from "@/lib/status-style";

type StatusBadgeProps = {
  status: string;
  children?: ReactNode;
  className?: string;
};

export function StatusBadge({ status, children, className = "" }: StatusBadgeProps) {
  const classes = ["badge", statusBadgeClassName(status), className].filter(Boolean).join(" ");

  return <span className={classes}>{children ?? status}</span>;
}
