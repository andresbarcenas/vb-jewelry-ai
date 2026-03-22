"use client";

import type { ReactNode } from "react";

interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  emptyTitle = "No matching items",
  emptyDescription = "Try changing the filters to see more results.",
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[28px] border border-border/80 bg-white/80 p-6 text-center shadow-[0_18px_45px_rgba(68,52,35,0.08)]">
        <h3 className="text-base font-semibold text-foreground">{emptyTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-border/80 bg-white/82 shadow-[0_18px_45px_rgba(68,52,35,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/80">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-accent-soft/45">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="align-top">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-4 text-sm leading-6 text-foreground ${column.className ?? ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
