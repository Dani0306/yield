import React from "react";

// Muted green/red for signed figures; neutral when zero.
export const signClass = (value: number) =>
  value > 0 ? "text-green-700" : value < 0 ? "text-red-700" : "";

type SectionProps = {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
};

export const Section = ({ title, meta, children }: SectionProps) => (
  <section className="flex flex-col gap-5">
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-base font-medium text-black">{title}</h2>
      {meta && <span className="text-xs text-gray-500">{meta}</span>}
    </div>
    {children}
  </section>
);

type StatProps = {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  size?: "md" | "lg";
  valueClassName?: string;
};

export const Stat = ({
  label,
  value,
  sub,
  size = "md",
  valueClassName = "",
}: StatProps) => (
  <div className="flex min-w-0 flex-col gap-2">
    <span className="text-xs text-gray-500">{label}</span>
    <span
      className={`truncate font-mono tracking-tight text-black ${
        size === "lg" ? "text-2xl" : "text-xl"
      } ${valueClassName}`}
    >
      {value}
    </span>
    {sub && <span className="truncate text-xs text-gray-500">{sub}</span>}
  </div>
);

const gridColumns = {
  4: "grid-cols-2 lg:grid-cols-4",
  // Six money figures don't fit one row until the screen is wide.
  6: "grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6",
};

// Cells sit on a 1px gray background with 1px gaps, so there's a thin line
// between every cell (vertical and horizontal) and none around the outside.
// The negative margin keeps the first column's text aligned with the page.
export const StatGrid = ({
  columns,
  children,
}: {
  columns: keyof typeof gridColumns;
  children: React.ReactNode;
}) => (
  <div className="-mx-4 max-lg:border-y max-lg:border-gray-200">
    <div
      className={`grid gap-px bg-gray-200 ${gridColumns[columns]} [&>*]:bg-white [&>*]:px-4 [&>*]:py-4`}
    >
      {children}
    </div>
  </div>
);
