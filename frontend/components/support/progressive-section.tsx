"use client";

import { useState, type ReactNode } from "react";

type ProgressiveSectionProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel: string;
  closeLabel?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function ProgressiveSection({
  eyebrow = "Area Kerja",
  title,
  description,
  actionLabel,
  closeLabel = "Tutup Form",
  defaultOpen = false,
  children,
}: ProgressiveSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <div className="hris-page-toolbar">
        <div>
          <span>{eyebrow}</span>
          <strong>{title}</strong>
          <p>{description}</p>
        </div>
        <div className="hris-toolbar-actions">
          <button
            className={open ? "btn btn-light" : "btn btn-primary"}
            type="button"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? closeLabel : actionLabel}
          </button>
        </div>
      </div>
      {open ? children : null}
    </>
  );
}
