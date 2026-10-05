"use client";

import { useFilters } from "@/hooks/shared/useFilters";
import PageContainer from "../layout/PageContainer";
import Table, { type TableColumn } from "../layout/table/Table";
import ResultActions from "./ResultActions";
import { formatGameDate, formatPercent, hasKickedOff } from "@/lib/utils/fn";
import type { ModelResult, ResultBet, ResultOddsSummary } from "@/types";
import { useModal } from "../providers/ModalProvider";
import { useState } from "react";
import { findClash, kickOffTime } from "@/lib/utils/results";

const rowKey = (r: ModelResult) =>
  `${r.match_date}-${r.home_team}-${r.away_team}-${r.scraped_at}`;

// A result, the selected match that blocks it and the bet placed from it
// (null when there's none).
type Row = ModelResult & {
  clash: ModelResult | null;
  bet: ResultBet | null;
  // Bookmaker odds collected when the result was selected.
  odds: ResultOddsSummary | null;
};

const columns: TableColumn<Row>[] = [
  { key: "home_team", header: "Home", width: "18%" },
  { key: "away_team", header: "Away", width: "18%" },
  {
    key: "game_date",
    header: "Date",
    width: "13%",
    cellClassName: "text-gray-500",
    render: (r) => formatGameDate(r.game_date),
  },
  {
    key: "rank_gap",
    header: "Rank gap",
    width: "9%",
    align: "right",
    cellClassName: "font-mono",
    render: (r) => r.rank_gap ?? "-",
  },
  {
    key: "league_draw_rate",
    header: "League draws",
    width: "12%",
    align: "right",
    cellClassName: "font-mono text-gray-500",
    // Stored as a share (0.2614); shown as a percentage like Draw %.
    render: (r) =>
      r.league_draw_rate === null
        ? "-"
        : formatPercent(r.league_draw_rate * 100, 1),
  },
  {
    key: "draw_percentage",
    header: "Draw %",
    width: "12%",
    align: "right",
    cellClassName: "font-mono font-medium text-black",
    render: (r) => formatPercent(r.draw_percentage, 1),
  },
  {
    key: "action",
    header: "",
    width: "18%",
    align: "right",
    render: (r) => (
      <ResultActions result={r} clash={r.clash} bet={r.bet} odds={r.odds} />
    ),
  },
];

const MobileRow = (r: Row) => (
  <div className="flex items-center gap-4">
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="truncate text-black">
        {r.home_team} v {r.away_team}
      </span>
      <span className="truncate text-xs text-gray-500">
        {formatGameDate(r.game_date)} · Rank gap {r.rank_gap ?? "–"}
      </span>
    </div>
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span className="font-mono text-black">
        {formatPercent(r.draw_percentage, 1)}
      </span>
      <span className="font-mono text-xs text-gray-500">
        League{" "}
        {r.league_draw_rate === null
          ? "-"
          : formatPercent(r.league_draw_rate * 100, 1)}
      </span>
    </div>
    <ResultActions result={r} clash={r.clash} bet={r.bet} odds={r.odds} />
  </div>
);

const tabs = [
  { label: "All", value: "" },
  { label: "Selected", value: "selected" },
];

type DrawOddsContentProps = {
  results: ModelResult[];
  selected: ModelResult[];
  // Bets placed from the listed results, keyed by result id.
  bets: Record<number, ResultBet>;
  // Bookmaker odds of the selected results, keyed by result id.
  odds: Record<number, ResultOddsSummary>;
};

const DrawOddsContent = ({
  results,
  selected,
  bets,
  odds,
}: DrawOddsContentProps) => {
  const { setFilter, hasFilter } = useFilters();
  const { openModal } = useModal();
  const showingSelected = hasFilter({ type: "filter", value: "selected" });
  const [now] = useState(() => Date.now());
  const rows: Row[] = (
    showingSelected
      ? [...results].sort((a, b) => kickOffTime(a) - kickOffTime(b))
      : results.filter((r) => !hasKickedOff(r, now))
  ).map((r) => ({
    ...r,
    clash: findClash(r, selected),
    bet: bets[r.id] ?? null,
    odds: odds[r.id] ?? null,
  }));

  return (
    <PageContainer
      title="Draw odds"
      description="The model's draw estimates, highest first for each match day."
    >
      <div className="flex gap-4" role="group" aria-label="Show results">
        {tabs.map((tab) => {
          const active = tab.value ? showingSelected : !showingSelected;
          return (
            <button
              key={tab.label}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter({ type: "filter", value: tab.value })}
              className={`cursor-pointer border-b px-2 pb-1 text-sm transition-colors ${
                active
                  ? "border-black font-medium text-black"
                  : "border-transparent text-gray-600 hover:text-black"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <Table
        columns={columns}
        rows={rows}
        getRowKey={rowKey}
        onRowClick={(row) =>
          openModal("result", { result: row, clash: row.clash, bet: row.bet })
        }
        getRowClassName={(r) =>
          hasKickedOff(r, now) || r.clash ? "opacity-40" : ""
        }
        renderMobileRow={MobileRow}
        emptyMessage={
          showingSelected ? "No selected results yet" : "No results to select"
        }
      />
    </PageContainer>
  );
};

export default DrawOddsContent;
