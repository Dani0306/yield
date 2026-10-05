"use client";

import PageContainer from "../layout/PageContainer";
import Table, { type TableColumn } from "../layout/table/Table";
import { formatMoney, formatShortDate, withSign } from "@/lib/utils/fn";
import type { Bet, BetStatus } from "@/types";
import { useModal } from "../providers/ModalProvider";

const statusLabels: Record<BetStatus, string> = {
  pending: "Pending",
  won: "Won",
  lost: "Lost",
  void: "Void",
};

// Unsettled bets read quieter than settled ones.
const statusClass: Record<BetStatus, string> = {
  pending: "text-gray-500",
  won: "text-gray-900",
  lost: "text-gray-900",
  void: "text-gray-500",
};

const profitClass = (bet: Bet) => {
  if (bet.status === "pending" || bet.status === "void" || bet.profit === 0)
    return "text-yellow-500";
  return bet.profit > 0 ? "text-green-700" : "text-red-700";
};

const tableColumns: TableColumn<Bet>[] = [
  {
    key: "match_date",
    header: "Date",
    width: "7%",
    cellClassName: "text-gray-500",
    render: (bet) => formatShortDate(bet.match_date),
  },
  {
    key: "match",
    header: "Match",
    width: "28%",
    render: (bet) => `${bet.home_team} v ${bet.away_team}`,
  },
  {
    key: "odds",
    header: "Odds",
    width: "9%",
    align: "right",
    cellClassName: "font-mono",
    render: (bet) => bet.odds.toFixed(2),
  },
  {
    key: "stake",
    header: "Stake",
    width: "9%",
    align: "right",
    cellClassName: "font-mono",
    render: (bet) => `${bet.stake.toFixed(2)}u`,
  },
  {
    key: "amount",
    header: "Amount",
    width: "11%",
    align: "right",
    cellClassName: "font-mono",
    render: (bet) => formatMoney(bet.amount),
  },
  {
    key: "advantage",
    header: "Advantage",
    width: "11%",
    align: "right",
    cellClassName: "font-mono",
    render: (bet) => withSign(bet.advantage, (n) => `${n.toFixed(2)}%`),
  },
  {
    key: "status",
    header: "Status",
    width: "13%",
    align: "right",
    render: (bet) => (
      <span className={statusClass[bet.status]}>
        {statusLabels[bet.status]}
      </span>
    ),
  },
  {
    key: "profit",
    header: "Profit",
    width: "12%",
    align: "right",
    cellClassName: "font-mono",
    // Pending bets have no result yet, so show a dash instead of €0.00.
    render: (bet) => (
      <span className={profitClass(bet)}>
        {bet.status === "pending" ? "–" : withSign(bet.profit, formatMoney)}
      </span>
    ),
  },
];

const BetsContent = ({ bets }: { bets: Bet[] }) => {
  const { openModal } = useModal();

  return (
    <PageContainer title="Bets" description="See the full bet history">
      <Table
        columns={tableColumns}
        rows={bets}
        getRowKey={(bet) => bet.id}
        onRowClick={(bet) => openModal("bet", { bet })}
        emptyMessage="No bets yet"
      />
    </PageContainer>
  );
};

export default BetsContent;
