import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerAction?: ReactNode;
};

export function SectionCard({ title, children, className = "", bodyClassName = "", headerAction }: SectionCardProps) {
  return (
    <div className={["card", className].filter(Boolean).join(" ")}>
      <div className="card-header">
        <h4 className="card-title">{title}</h4>
        {headerAction}
      </div>
      <div className={["card-body", bodyClassName].filter(Boolean).join(" ")}>{children}</div>
    </div>
  );
}
