"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  formatDateTime,
  formatMoney,
  formatPercent,
  formatUnits,
} from "@/lib/utils/fn";
import type { DashboardData } from "@/types";

type NextEventProps = {
  event: DashboardData["nextEvent"];
  // Stake for the next bet, from the current progression (null when there's
  // no progression yet).
  nextStake: { units: number; amount: number } | null;
};

const pad = (n: number) => String(n).padStart(2, "0");

// Whole days plus an "HH:MM:SS" clock for the rest.
const splitCountdown = (ms: number) => {
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86_400),
    clock: `${pad(Math.floor((total % 86_400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`,
  };
};

// Time left until kick-off, ticking every second. The first render uses the
// server's figure (whole minutes), so server and browser render the same
// text; the live count takes over once the page is running.
const Countdown = ({
  kickOff,
  minutesUntil,
}: {
  kickOff: string;
  minutesUntil: number;
}) => {
  const [msLeft, setMsLeft] = useState(minutesUntil * 60_000);

  useEffect(() => {
    const target = Date.parse(kickOff);
    const id = setInterval(
      () => setMsLeft(Math.max(0, target - Date.now())),
      1000,
    );
    return () => clearInterval(id);
  }, [kickOff]);

  const started = msLeft <= 0;
  const soon = msLeft <= 2 * 60 * 60_000;
  const { days, clock } = splitCountdown(msLeft);

  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-2 text-xs text-gray-500">
        <span
          className={`size-1.5 shrink-0 rounded-full ${soon ? "bg-black" : "bg-gray-400"}`}
        />
        {started ? "Kick-off" : "Kick-off in"}
      </span>
      <span
        role="timer"
        // Read once, not every second.
        aria-live="off"
        className="font-mono text-4xl leading-none tracking-tight whitespace-nowrap text-black tabular-nums sm:text-5xl"
      >
        {started ? (
          "Now"
        ) : (
          <>
            {/* More than a day away: the days sit smaller beside the clock. */}
            {days > 0 && (
              <span className="mr-3 text-xl text-gray-500 sm:text-2xl">
                {days} d
              </span>
            )}
            {clock}
          </>
        )}
      </span>
    </div>
  );
};

// A heads-up at the top of the dashboard: the next selected match to bet on,
// led by a live countdown to its kick-off.
const NextEvent = ({ event, nextStake }: NextEventProps) => {
  if (!event)
    return (
      <p className="text-xs text-gray-500">
        No upcoming selected matches.{" "}
        <Link
          href="/draw-odds"
          className="text-black underline-offset-4 hover:underline"
        >
          Pick some in Draw odds
        </Link>
      </p>
    );

  return (
    <section
      aria-label="Next event"
      className="flex flex-col gap-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-xs text-gray-500">
          {event.afterPending ? "Next up, after your pending bet" : "Next up"}
        </span>
        <Link
          href="/draw-odds?filter=selected"
          className="shrink-0 text-xs text-black underline-offset-4 hover:underline"
        >
          View selected
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <Countdown kickOff={event.kickOff} minutesUntil={event.minutesUntil} />

        <div className="flex min-w-0 flex-col gap-1.5 lg:flex-1 lg:px-10">
          <span className="truncate text-lg text-black">
            {event.homeTeam} v {event.awayTeam}
          </span>
          <span className="truncate text-xs text-gray-500">
            {formatDateTime(event.kickOff)} · {event.league} · Draw{" "}
            {formatPercent(event.drawPercentage, 1)}
          </span>
        </div>

        {nextStake && (
          <div className="flex flex-col gap-1 border-t border-gray-200 pt-4 lg:items-end lg:border-t-0 lg:pt-0">
            <span className="font-mono text-base text-black">
              {formatMoney(nextStake.amount)} · {formatUnits(nextStake.units)}
            </span>
            <span className="text-xs text-gray-500">
              {event.afterPending
                ? "stake if the pending bet loses"
                : "next stake"}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default NextEvent;
