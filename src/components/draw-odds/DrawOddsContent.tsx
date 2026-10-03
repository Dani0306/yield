"use client";

import { useFilters } from "@/hooks/shared/useFilters";
import PageContainer from "../layout/PageContainer";
import Table, { type TableColumn } from "../layout/table/Table";
import PageButton from "../ui/PageButton";
import {
  formatGameDate,
  formatPercent,
  hasKickedOff,
  kickOff,
} from "@/lib/utils/fn";
import type { ModelResult } from "@/types";
import { useSelectResult } from "@/hooks/results/useSelectResult";
import { useModal } from "../providers/ModalProvider";
import { useState } from "react";

// match_date is a plain date ("2026-10-03"). Read as midnight UTC it shows
// the day before in Colombia, so format it from midday instead.

// A match appears once per scrape (the table's unique key).
const rowKey = (r: ModelResult) =>
  `${r.match_date}-${r.home_team}-${r.away_team}-${r.scraped_at}`;

const columns: TableColumn<ModelResult>[] = [
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
    render: (r) => r.rank_gap ?? "–",
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
    render: (r) => <ResultActions result={r} />,
  },
];

// Unselected results can only be selected. Selected ones can be bet on, or
// deselected to send them back to the rest.
const ResultActions = ({ result }: { result: ModelResult }) => {
  const { setSelected, isPending } = useSelectResult();
  const { openModal } = useModal();
  const match = `${result.home_team} v ${result.away_team}`;

  if (isPending)
    return (
      <span className="text-xs text-gray-500">
        {result.added ? "Removing…" : "Selecting…"}
      </span>
    );

  if (!result.added)
    return (
      <PageButton
        text="Select"
        aria-label={`Select ${match}`}
        onClick={() => setSelected(result, true)}
        className="rounded-md px-3! py-1.5! text-xs"
      />
    );

  return (
    <div className="inline-flex items-center gap-3 max-md:flex-col-reverse max-md:items-end max-md:gap-1.5">
      <button
        type="button"
        aria-label={`Deselect ${match}`}
        onClick={() => setSelected(result, false)}
        className="cursor-pointer text-xs text-gray-500 transition-colors hover:text-black"
      >
        Deselect
      </button>
      <PageButton
        text="Bet"
        aria-label={`Bet on ${match}`}
        onClick={() =>
          openModal("createBet", {
            homeTeam: result.home_team,
            awayTeam: result.away_team,
            matchDate: kickOff(result),
            drawPercentage: result.draw_percentage,
          })
        }
        className="rounded-md px-3! py-1.5! text-xs"
      />
    </div>
  );
};

const MobileRow = (r: ModelResult) => (
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
    <ResultActions result={r} />
  </div>
);

const tabs = [
  { label: "All", value: "" },
  { label: "Selected", value: "selected" },
];

const DrawOddsContent = ({ results }: { results: ModelResult[] }) => {
  const { setFilter, hasFilter } = useFilters();
  const showingSelected = hasFilter({ type: "filter", value: "selected" });
  // Read once per render of the list; matches that already kicked off
  // are grayed out.
  const [now] = useState(() => Date.now());
  // Unselected matches that already kicked off can't be bet on: hide them.
  // Selected ones stay (grayed out) until you deselect them.
  const rows = showingSelected
    ? results
    : results.filter((r) => !hasKickedOff(r, now));

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
        getRowClassName={(r) => (hasKickedOff(r, now) ? "opacity-40" : "")}
        renderMobileRow={MobileRow}
        emptyMessage={
          showingSelected ? "No selected results yet" : "No results to select"
        }
      />
    </PageContainer>
  );
};

export default DrawOddsContent;
