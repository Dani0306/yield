import type React from "react";

export type TableColumn<T> = {
  // Unique id for the column; also the row field shown when there's no render.
  key: string;
  header: string;
  // Share of the table width, e.g. "20%".
  width: string;
  // Custom cell content. Defaults to row[key].
  render?: (row: T) => React.ReactNode;
  // Header and cell alignment. Use "right" for numbers. Defaults to "left".
  align?: "left" | "right";
  // Extra classes for this column's body cells, e.g. "font-mono".
  cellClassName?: string;
};

export type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  // Unique, stable id for each row (used as the React key).
  getRowKey: (row: T) => string | number;
  // Called with the clicked row. Rows are only clickable when this is set.
  onRowClick?: (row: T) => void;
  // Shown when there are no rows.
  emptyMessage?: React.ReactNode;
  // Custom content for each mobile card. Defaults to one label/value line per column.
  renderMobileRow?: (row: T) => React.ReactNode;
};
