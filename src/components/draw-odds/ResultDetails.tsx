"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { Detail, SectionTitle } from "../ui/Details";
import ResultActions from "./ResultActions";
import {
  formatDate,
  formatDateTime,
  formatGameDate,
  formatPercent,
  hasKickedOff,
  withSign,
} from "@/lib/utils/fn";
import type { ModelResult, ResultBet } from "@/types";

type ResultDetailsProps = {
  result: ModelResult;
  // The selected match this one overlaps, if any.
  clash?: ModelResult | null;
  // The bet already placed from this result, if any.
  bet?: ResultBet | null;
  onClose: () => void;
};

// Model numbers come with up to 4 decimals; trailing zeros are dropped.
const num = (value: number | null, digits = 4) =>
  value === null ? "–" : String(Number(value.toFixed(digits)));

// Shares stored as 0–1 (0.2614), shown as percentages (26.14%).
const share = (value: number | null) =>
  value === null ? "–" : formatPercent(value * 100);

const pct = (value: number | null) =>
  value === null ? "–" : formatPercent(value);

// Percentage points and EV, always signed: +3.9 pts, −5.5%.
const points = (value: number | null) =>
  value === null ? "–" : `${withSign(value, (n) => n.toFixed(2))} pts`;

const signedPct = (value: number | null) =>
  value === null ? "–" : withSign(value, (n) => formatPercent(n));

const odds = (value: number | null) =>
  value === null ? "–" : value.toFixed(2);

const dateTime = (value: string | null) =>
  value === null ? "–" : formatDateTime(value);

const yesNo = (value: boolean | null) =>
  value === null ? "–" : value ? "Yes" : "No";

// match_date is a plain date; read from midday so it stays the same day
// in Colombian time.
const matchDay = (date: string) => formatDate(`${date}T12:00:00Z`);

const ProbabilityBar = ({
  label,
  value,
  scaleMax,
  fillClassName,
}: {
  label: string;
  value: number;
  scaleMax: number;
  fillClassName: string;
}) => (
  <div className="flex items-center gap-4">
    <span className="w-24 shrink-0 text-xs text-gray-500">{label}</span>
    <div className="h-1 flex-1 bg-gray-100">
      <div
        className={`h-full ${fillClassName}`}
        style={{ width: `${Math.min((value / scaleMax) * 100, 100)}%` }}
      />
    </div>
  </div>
);

// The draw estimate against the plain Poisson model and the league's
// actual draw rate.
const DrawHighlight = ({ result }: { result: ModelResult }) => {
  const estimate = result.draw_percentage;
  const poisson =
    result.prob_poisson === null ? null : result.prob_poisson * 100;
  const league =
    result.league_draw_rate === null ? null : result.league_draw_rate * 100;
  // All bars share one scale with headroom, so differences are easy to see.
  const scaleMax = Math.max(
    50,
    Math.ceil(Math.max(estimate, poisson ?? 0, league ?? 0) / 10) * 10,
  );

  return (
    <section className="flex flex-col gap-5 rounded-md border border-gray-200 p-5">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-500">Draw estimate</span>
          <span className="font-mono text-3xl tracking-tight text-black sm:text-4xl">
            {formatPercent(estimate, 1)}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-500">Poisson only</span>
          <span className="font-mono text-3xl tracking-tight text-gray-500 sm:text-4xl">
            {poisson === null ? "–" : formatPercent(poisson, 1)}
          </span>
        </div>
        <div className="col-span-2 flex flex-col gap-1.5 border-t border-gray-200 pt-4 sm:col-span-1 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
          <span className="text-xs text-gray-500">League draw rate</span>
          <span className="font-mono text-3xl tracking-tight text-gray-500 sm:text-4xl">
            {league === null ? "–" : formatPercent(league, 1)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <ProbabilityBar
          label="Estimate"
          value={estimate}
          scaleMax={scaleMax}
          fillClassName="bg-black"
        />
        {poisson !== null && (
          <ProbabilityBar
            label="Poisson only"
            value={poisson}
            scaleMax={scaleMax}
            fillClassName="bg-gray-400"
          />
        )}
        {league !== null && (
          <ProbabilityBar
            label="League"
            value={league}
            scaleMax={scaleMax}
            fillClassName="bg-gray-300"
          />
        )}
      </div>
    </section>
  );
};

// The value finder's verdict, then every figure behind it: the model
// against the market, the prices and the expected value.
const ValueFinder = ({ result }: { result: ModelResult }) => (
  <section className="flex flex-col">
    <SectionTitle>Value</SectionTitle>
    <div className="flex flex-col gap-1 border-b border-gray-200 pb-4">
      <span
        className={`font-mono text-2xl tracking-tight ${
          result.decision === "BET"
            ? "font-medium text-black"
            : result.decision === "SKIP"
              ? "text-gray-400"
              : "text-gray-700"
        }`}
      >
        {result.decision ?? "No decision"}
      </span>
      <span className="text-sm text-gray-500">
        {result.reason ?? "Not checked by the value finder."}
      </span>
    </div>
    <dl className="grid gap-x-12 sm:grid-cols-2">
      <div>
        <Detail label="Model draw" value={pct(result.model_draw_pct)} mono />
        <Detail
          label="Market draw (fair)"
          value={
            result.market_fair_pct === null ? (
              "–"
            ) : (
              <>
                {pct(result.market_fair_pct)}
                {result.market_source && (
                  <span className="font-sans text-gray-500">
                    {" "}
                    · {result.market_source}
                  </span>
                )}
              </>
            )
          }
          mono
        />
        <Detail label="Blended draw" value={pct(result.p_blend_pct)} mono />
        <Detail label="Edge" value={points(result.edge_pp)} mono />
        <Detail
          label="Market margin"
          value={pct(result.market_margin_pct)}
          mono
        />
        <Detail
          label="Bookmakers"
          value={result.bookmakers_count ?? "–"}
          mono
        />
        <Detail label="Odds fetched" value={dateTime(result.odds_fetched_at)} />
      </div>
      <div>
        <Detail
          label="Best odds"
          value={
            result.best_odds === null ? (
              "–"
            ) : (
              <>
                {odds(result.best_odds)}
                {result.best_bookmaker && (
                  <span className="font-sans text-gray-500">
                    {" "}
                    · {result.best_bookmaker}
                  </span>
                )}
              </>
            )
          }
          mono
        />
        <Detail
          label="Best implied"
          value={pct(result.best_implied_pct)}
          mono
        />
        <Detail label="Average odds" value={odds(result.avg_draw_odds)} mono />
        <Detail label="Fair odds" value={odds(result.fair_odds)} mono />
        <Detail label="EV (blended)" value={signedPct(result.ev_pct)} mono />
        <Detail
          label="EV (model)"
          value={signedPct(result.model_ev_pct)}
          mono
        />
        <Detail
          label="EV (market)"
          value={signedPct(result.market_ev_pct)}
          mono
        />
      </div>
    </dl>
  </section>
);

// Home and away side by side, one row per measure.
const TeamComparison = ({ result }: { result: ModelResult }) => {
  const rows: { label: string; home: string; away: string }[] = [
    {
      label: "Expected goals (λ)",
      home: num(result.lambda_home),
      away: num(result.lambda_away),
    },
    { label: "Attack", home: num(result.home_att), away: num(result.away_att) },
    {
      label: "Defence",
      home: num(result.home_def),
      away: num(result.away_def),
    },
    {
      label: "Draw rate",
      home: pct(result.home_draw_pct),
      away: pct(result.away_draw_pct),
    },
    {
      label: "Games",
      home: num(result.home_games),
      away: num(result.away_games),
    },
    {
      label: "Used split",
      home: yesNo(result.home_used_split),
      away: yesNo(result.away_used_split),
    },
  ];

  return (
    <table className="w-full table-fixed text-sm">
      <thead>
        <tr>
          <th
            scope="col"
            className="w-2/5 pb-3 text-left text-xs font-normal text-gray-500"
          >
            <span className="sr-only">Measure</span>
          </th>
          <th
            scope="col"
            className="truncate pb-3 text-right font-medium text-black"
          >
            {result.home_team}
          </th>
          <th
            scope="col"
            className="truncate pb-3 pl-4 text-right font-medium text-black"
          >
            {result.away_team}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="">
            <th
              scope="row"
              className="py-3 text-left text-xs font-normal text-gray-500"
            >
              {row.label}
            </th>
            <td className="py-3 text-right font-mono text-black">{row.home}</td>
            <td className="py-3 pl-4 text-right font-mono text-black">
              {row.away}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Everything stored for one model result, opened from a row on the Draw
// odds page.
const ResultDetails = ({ result, clash, bet, onClose }: ResultDetailsProps) => {
  const [now] = useState(() => Date.now());
  const started = hasKickedOff(result, now);

  return (
    <Modal
      size="xl"
      className="p-4"
      onClose={onClose}
      eyebrow={`${result.league} · #${String(result.id).padStart(4, "0")}`}
      title={`${result.home_team} v ${result.away_team}`}
      titleSize="lg"
      description={
        <>
          <span className="text-black">
            {result.added ? "Selected" : "Not selected"}
          </span>{" "}
          · {started ? "Kicked off" : "Kick-off"}{" "}
          {formatGameDate(result.game_date)}
        </>
      }
      actions={
        <ResultActions
          result={result}
          clash={clash}
          bet={bet}
          onChange={onClose}
        />
      }
    >
      <div className="flex flex-col gap-10 pt-4">
        {clash && (
          <p className="-mb-4 text-sm text-gray-500">
            Blocked: it overlaps{" "}
            <span className="text-black">
              {clash.home_team} v {clash.away_team}
            </span>{" "}
            ({formatGameDate(clash.game_date)}), which you&apos;ve selected.
          </p>
        )}

        <DrawHighlight result={result} />

        <ValueFinder result={result} />

        <section className="flex flex-col">
          <SectionTitle>Teams</SectionTitle>
          <TeamComparison result={result} />
        </section>

        <section className="flex flex-col">
          <SectionTitle>Model</SectionTitle>
          <dl className="grid gap-x-12 sm:grid-cols-2">
            <div>
              <Detail
                label="Draw probability"
                value={share(result.prob)}
                mono
              />
              <Detail
                label="Poisson probability"
                value={share(result.prob_poisson)}
                mono
              />
              <Detail label="Score" value={num(result.score)} mono />
            </div>
            <div>
              <Detail label="Rho (ρ)" value={num(result.rho)} mono />
              <Detail label="Attack gap" value={num(result.att_delta)} mono />
              <Detail label="Rank gap" value={num(result.rank_gap)} mono />
            </div>
          </dl>
          <dl>
            <Detail label="Method" value={result.method ?? "–"} />
          </dl>
        </section>

        <section className="flex flex-col">
          <SectionTitle>Source</SectionTitle>
          <dl className="grid gap-x-12 sm:grid-cols-2">
            <div>
              <Detail label="League" value={result.league} />
              <Detail label="League id" value={result.league_id} mono />
              <Detail label="Match date" value={matchDay(result.match_date)} />
              <Detail label="Kick-off" value={dateTime(result.kick_off)} />
            </div>
            <div>
              <Detail label="Kick-off (source)" value={result.game_date} mono />
              <Detail
                label="Scraped"
                value={formatDateTime(result.scraped_at)}
              />
              <Detail label="Result id" value={`#${result.id}`} mono />
              <Detail
                label="Reminder sent"
                value={dateTime(result.reminder_sent_at)}
              />
            </div>
          </dl>
        </section>
      </div>
    </Modal>
  );
};

export default ResultDetails;
