import type React from "react";
import type { TableColumn } from "./types";

export const renderCell = <T,>(column: TableColumn<T>, row: T): React.ReactNode =>
  column.render
    ? column.render(row)
    : ((row as Record<string, unknown>)[column.key] as React.ReactNode);

// Makes a clickable row reachable and usable with the keyboard (Tab + Enter/Space).
export const clickableProps = <T,>(row: T, onRowClick?: (row: T) => void) =>
  onRowClick
    ? {
        onClick: () => onRowClick(row),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onRowClick(row);
          }
        },
        tabIndex: 0,
        role: "button" as const,
      }
    : {};
