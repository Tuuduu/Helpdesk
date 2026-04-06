"use client";

import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortDesc?: boolean;
  onSort?: (key: string) => void;
  rowKey?: (row: T) => string;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "Мэдээлэл олдсонгүй",
  emptyIcon,
  onRowClick,
  sortBy,
  sortDesc,
  onSort,
  rowKey,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-3/4" />
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

  if (data.length === 0) {
    return (
      <div className="glass p-10">
        <EmptyState message={emptyMessage} icon={emptyIcon} />
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.align !== "center" && col.align !== "right" && "text-left",
                    col.sortable && "cursor-pointer select-none hover:text-gray-700",
                    col.width
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortBy === col.key ? (
                      sortDesc ? (
                        <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUp className="w-3 h-3" />
                      )
                    ) : (
                      col.sortable && (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row) : index}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-gray-50 transition-colors",
                  onRowClick &&
                    "cursor-pointer hover:bg-white/40"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-sm text-gray-700",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
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
