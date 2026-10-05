"use client";

import Table, { type TableColumn } from "@/components/layout/table/Table";
import { formatDateRange, formatMoney, withSign } from "@/lib/utils/fn";
import { useRouter } from "next/navigation";
import type { ProgressionWithStats } from "@/types";
import {
  progressionStatusClass as resultClass,
  progressionStatusLabels as resultLabels,
} from "@/lib/utils/progressions";
import { Section, signClass } from "./DashboardUI";

const attemptsText = (count: number) =>
  `${count} attempt${count === 1 ? "" : "s"}`;

const columns: TableColumn<ProgressionWithStats>[] = [
  {
    key: "progression_number",
    header: "#",
    width: "10%",
    cellClassName: "font-mono",
  },
  {
    key: "dates",
    header: "Dates",
    width: "30%",
    render: (p) => formatDateRange(p.start_date, p.end_date),
  },
  {
    key: "total_attempts",
    header: "Attempts",
    width: "14%",
    align: "right",
    cellClassName: "font-mono",
  },
  {
    key: "total_bet_amount",
    header: "Invested",
    width: "16%",
    align: "right",
    cellClassName: "font-mono",
    render: (p) => formatMoney(p.total_bet_amount),
  },
  {
    key: "profit",
    header: "Profit",
    width: "16%",
    align: "right",
    cellClassName: "font-mono",
    render: (p) => (
      <span className={signClass(p.profit)}>
        {withSign(p.profit, formatMoney)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Result",
    width: "14%",
    render: (p) => (
      <span className={resultClass(p.status)}>{resultLabels[p.status]}</span>
    ),
  },
];

const MobileRow = (p: ProgressionWithStats) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-black">
        #{p.progression_number} · {attemptsText(p.total_attempts)}
      </span>
      <span className="truncate text-xs text-gray-500">
        {formatDateRange(p.start_date, p.end_date)} · {resultLabels[p.status]}
      </span>
    </div>
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span className={`font-mono ${signClass(p.profit)}`}>
        {withSign(p.profit, formatMoney)}
      </span>
      <span className="font-mono text-xs text-gray-500">
        {formatMoney(p.total_bet_amount)} invested
      </span>
    </div>
  </div>
);

const PastProgressionsTable = ({
  progressions,
}: {
  progressions: ProgressionWithStats[];
}) => {
  const router = useRouter();

  return (
    <Section title="Past progressions" meta={`Last ${progressions.length}`}>
      <Table
        columns={columns}
        rows={progressions}
        getRowKey={(p) => p.progression_id}
        onRowClick={(p) => router.push(`/progression/${p.progression_number}`)}
        renderMobileRow={MobileRow}
        emptyMessage="No finished progressions yet"
      />
    </Section>
  );
};

export default PastProgressionsTable;
