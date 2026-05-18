import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

export type NilaiCardItem = {
  key: string;
  title: string;
  lines: Array<ReactNode>;
  href?: Route;
};

type NilaiCardGridProps = {
  items: Array<NilaiCardItem>;
  columns?: 2 | 3 | 4;
  className?: string;
};

export function NilaiCardGrid({ items, columns = 3, className }: NilaiCardGridProps) {
  const gridClassName = `grid grid-${columns} mt-16${className ? ` ${className}` : ""}`;

  return (
    <div className={gridClassName}>
      {items.map((item) =>
        item.href ? (
          <Link className="card" href={item.href} key={item.key}>
            <h3>{item.title}</h3>
            {item.lines.map((line, index) => (
              <p key={`${item.key}-${index}`}>{line}</p>
            ))}
          </Link>
        ) : (
          <div className="card" key={item.key}>
            <h3>{item.title}</h3>
            {item.lines.map((line, index) => (
              <p key={`${item.key}-${index}`}>{line}</p>
            ))}
          </div>
        ),
      )}
    </div>
  );
}
