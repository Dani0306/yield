"use client";

import { useFilters } from "@/hooks/shared/useFilters";
import PageContainer from "../layout/PageContainer";
import Table, { type TableColumn } from "../layout/table/Table";
import ResultActions from "./ResultActions";
import {
  formatGameDate,
  formatPercent,
  hasKickedOff,
  withSign,
} from "@/lib/utils/fn";
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

// The value finder's figures, from the model project's import. Empty when
// the game had no odds.
const pct = (value: number | null) =>
  value === null ? "–" : formatPercent(value, 1);

const ev = (value: number | null) =>
  value === null ? "–" : withSign(value, (n) => formatPercent(n, 1));

// BET stands out, WATCH is plain, SKIP fades. The word always says it, and
// the reason shows on hover.
const decisionClass: Record<string, string> = {
  BET: "font-medium text-black",
  WATCH: "text-gray-700",
  SKIP: "text-gray-400",
};

const Decision = ({ r }: { r: Row }) =>
  r.decision ? (
    <span
      title={r.reason ?? undefined}
      className={decisionClass[r.decision] ?? "text-gray-700"}
    >
      {r.decision}
    </span>
  ) : (
    <span className="text-gray-400">–</span>
  );

const columns: TableColumn<Row>[] = [
  { key: "home_team", header: "Home", width: "13%" },
  { key: "away_team", header: "Away", width: "13%" },
  {
    key: "game_date",
    header: "Date",
    width: "10%",
    cellClassName: "text-gray-500",
    render: (r) => formatGameDate(r.game_date),
  },
  {
    key: "draw_percentage",
    header: "Model",
    width: "8%",
    align: "right",
    cellClassName: "font-mono font-medium text-black",
    render: (r) => formatPercent(r.draw_percentage, 1),
  },
  {
    key: "market_fair_pct",
    header: "Market",
    width: "8%",
    align: "right",
    cellClassName: "font-mono text-gray-500",
    render: (r) => pct(r.market_fair_pct),
  },
  {
    key: "best_odds",
    header: "Best odds",
    width: "12%",
    align: "right",
    cellClassName: "font-mono",
    render: (r) =>
      r.best_odds === null ? (
        "–"
      ) : (
        <span className="flex flex-col items-end">
          <span className="text-black">{r.best_odds.toFixed(2)}</span>
          {r.best_bookmaker && (
            <span className="font-sans text-xs text-gray-500">
              {r.best_bookmaker}
            </span>
          )}
        </span>
      ),
  },
  {
    key: "ev_pct",
    header: "EV",
    width: "8%",
    align: "right",
    cellClassName: "font-mono text-black",
    render: (r) => ev(r.ev_pct),
  },
  {
    key: "decision",
    header: "Decision",
    width: "10%",
    render: (r) => <Decision r={r} />,
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
        {formatGameDate(r.game_date)} · <Decision r={r} />
      </span>
    </div>
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span className="font-mono text-black">
        {formatPercent(r.draw_percentage, 1)}
      </span>
      <span className="font-mono text-xs text-gray-500">
        {r.best_odds === null
          ? "No odds"
          : `${r.best_odds.toFixed(2)} · EV ${ev(r.ev_pct)}`}
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
