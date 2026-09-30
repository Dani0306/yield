"use client";

import Table, { type TableColumn } from "@/components/layout/table/Table";
import { useModal } from "@/components/providers/ModalProvider";
import {
  formatDayDate,
  formatMoney,
  formatPercent,
  formatShortDate,
  formatUnits,
  withSign,
} from "@/lib/utils/fn";
import type { Bet } from "@/types";
import { Section } from "./DashboardUI";
import {
  matchName,
  profitClass,
  profitText,
  statusClass,
  statusLabels,
} from "./betDisplay";

const advantageText = (bet: Bet) =>
  withSign(bet.advantage, (n) => formatPercent(n, 1));

const columns: TableColumn<Bet>[] = [
  { key: "attempt_number", header: "Attempt", width: "8%" },
  {
    key: "match_date",
    header: "Date",
    width: "12%",
    cellClassName: "text-gray-500",
    render: (bet) => formatShortDate(bet.match_date),
  },
  { key: "match", header: "Match", width: "22%", render: matchName },
  {
    key: "odds",
    header: "Odds",
    width: "8%",
    align: "right",
    cellClassName: "font-mono",
    render: (bet) => bet.odds.toFixed(2),
  },
  {
    key: "amount",
    header: "Stake",
    width: "12%",
    align: "right",
    cellClassName: "font-mono",
    render: (bet) => formatMoney(bet.amount),
  },
  {
    key: "stake",
    header: "Units",
    width: "8%",
    align: "right",
    cellClassName: "font-mono text-gray-500",
    render: (bet) => formatUnits(bet.stake),
  },
  {
    key: "advantage",
    header: "Advantage",
    width: "10%",
    align: "right",
    cellClassName: "font-mono",
    render: advantageText,
  },
  {
    key: "status",
    header: "Status",
    width: "9%",
    render: (bet) => (
      <span className={statusClass[bet.status]}>
        {statusLabels[bet.status]}
      </span>
    ),
  },
  {
    key: "profit",
    header: "Profit",
    width: "11%",
    align: "right",
    cellClassName: "font-mono",
    render: (bet) => (
      <span className={profitClass(bet)}>{profitText(bet)}</span>
    ),
  },
];

const MobileRow = (bet: Bet) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-black">
        {bet.attempt_number} {matchName(bet)}
      </span>
      <span className="truncate text-xs text-gray-500">
        {formatDayDate(bet.match_date)} · {bet.odds.toFixed(2)} ·{" "}
        {advantageText(bet)}
      </span>
    </div>
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span className={`font-mono ${profitClass(bet)}`}>
        {bet.status === "pending" ? "Pending" : profitText(bet)}
      </span>
      <span className="font-mono text-xs text-gray-500">
        {formatMoney(bet.amount)} · {formatUnits(bet.stake)}
      </span>
    </div>
  </div>
);

const ProgressionBetsTable = ({
  progressionId,
  bets,
}: {
  progressionId: number;
  bets: Bet[];
}) => {
  const { openModal } = useModal();

  return (
    <Section
      title="Current progression bets"
      meta={`#${progressionId} · attempt 1 first`}
    >
      <Table
        columns={columns}
        rows={bets}
        getRowKey={(bet) => bet.id}
        onRowClick={(bet) => openModal("bet", bet)}
        renderMobileRow={MobileRow}
        emptyMessage="No bets in this progression yet"
      />
    </Section>
  );
};

export default ProgressionBetsTable;
