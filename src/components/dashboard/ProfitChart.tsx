"use client";

import { useState } from "react";
import {
  formatDate,
  formatMoney,
  formatMoneyCompact,
  formatMonth,
  withSign,
} from "@/lib/utils/fn";
import type { DashboardData } from "@/types";
import { Section } from "./DashboardUI";

type Point = DashboardData["profitOverTime"][number];

// A "nice" tick step (1, 2, 2.5 or 5 × a power of 10) for roughly `count` ticks.
const niceStep = (range: number, count: number) => {
  const raw = range / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const n = raw / power;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * power;
};

const buildScale = (points: Point[]) => {
  const times = points.map((p) => new Date(p.date).getTime());
  const values = points.map((p) => p.cumulativeProfit);
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);

  // Always include zero so gains and losses read against the same baseline.
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const step = niceStep(high - low || 1, 4);
  const yMin = Math.floor(low / step) * step;
  const yMax = Math.ceil(high / step) * step;

  const ticks: number[] = [];
  for (let v = yMax; v >= yMin - step / 2; v -= step) ticks.push(Math.round(v));

  // Positions in % of the plot area (0–100).
  const x = (t: number) => (t1 === t0 ? 50 : ((t - t0) / (t1 - t0)) * 100);
  const y = (v: number) => ((yMax - v) / (yMax - yMin || 1)) * 100;

  // First day of each month inside the range, for the x-axis labels.
  const months: { label: string; x: number }[] = [];
  // Midday UTC keeps the date on the same day in Colombian time.
  const cursor = new Date(t0);
  cursor.setUTCDate(1);
  cursor.setUTCHours(12, 0, 0, 0);
  cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  while (cursor.getTime() <= t1) {
    months.push({ label: formatMonth(cursor.toISOString()), x: x(cursor.getTime()) });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  const positions = points.map((p, i) => ({ x: x(times[i]), y: y(values[i]) }));
  return { ticks, y, months, positions };
};

const ProfitChart = ({ points }: { points: Point[] }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <Section title="History">
        <p className="border-t border-gray-200 py-10 text-center text-sm text-gray-500">
          Not enough history for a chart yet.
        </p>
      </Section>
    );
  }

  const { ticks, y, months, positions } = buildScale(points);
  const path = positions.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const last = positions[positions.length - 1];
  const lastPoint = points[points.length - 1];
  const active = hovered !== null ? { point: points[hovered], pos: positions[hovered] } : null;

  // Snap the crosshair to the nearest point on the x-axis.
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    let nearest = 0;
    positions.forEach((p, i) => {
      if (Math.abs(p.x - px) < Math.abs(positions[nearest].x - px)) nearest = i;
    });
    setHovered(nearest);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const current = hovered ?? points.length - 1;
    const next = e.key === "ArrowLeft" ? current - 1 : current + 1;
    setHovered(Math.max(0, Math.min(points.length - 1, next)));
  };

  return (
    <Section title="History">
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-black">Profit over time</span>
          <span className="text-xs text-gray-500">Cumulative · settled bets</span>
        </div>

        <div className="flex gap-3">
          {/* Y-axis labels */}
          <div className="relative h-56 w-14 shrink-0 lg:h-64">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute right-0 -translate-y-1/2 font-mono text-[10px] text-gray-500"
                style={{ top: `${y(tick)}%` }}
              >
                {withSign(tick, formatMoneyCompact)}
              </span>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {/* Plot */}
            <div
              role="img"
              tabIndex={0}
              aria-label={`Cumulative profit, now ${withSign(lastPoint.cumulativeProfit, formatMoney)}. Use the arrow keys to read each point.`}
              className="relative h-56 cursor-crosshair outline-none focus-visible:ring-1 focus-visible:ring-black lg:h-64"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHovered(null)}
              onKeyDown={handleKeyDown}
              onBlur={() => setHovered(null)}
            >
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full overflow-visible"
                aria-hidden
              >
                {ticks.map((tick) => (
                  <line
                    key={tick}
                    x1={0}
                    x2={100}
                    y1={y(tick)}
                    y2={y(tick)}
                    vectorEffect="non-scaling-stroke"
                    className={tick === 0 ? "stroke-gray-300" : "stroke-gray-100"}
                    strokeWidth={1}
                  />
                ))}
                <path
                  d={path}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-black"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>

              {/* Notes on notable points, e.g. an abandoned progression */}
              {points.map((point, i) =>
                point.note ? (
                  <span
                    key={point.date}
                    className="pointer-events-none absolute -translate-x-1/2 translate-y-2 font-mono text-[10px] whitespace-nowrap text-gray-500"
                    style={{ left: `${positions[i].x}%`, top: `${positions[i].y}%` }}
                  >
                    {point.note}
                  </span>
                ) : null,
              )}

              {/* Current value */}
              <span
                aria-hidden
                className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black"
                style={{ left: `${last.x}%`, top: `${last.y}%` }}
              />

              {active && (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 w-px bg-gray-300"
                    style={{ left: `${active.pos.x}%` }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black ring-2 ring-white"
                    style={{ left: `${active.pos.x}%`, top: `${active.pos.y}%` }}
                  />
                  <div
                    role="status"
                    className={`pointer-events-none absolute top-0 flex flex-col gap-0.5 border border-gray-200 bg-white px-3 py-2 whitespace-nowrap ${
                      active.pos.x > 65 ? "-translate-x-full -ml-3" : "ml-3"
                    }`}
                    style={{ left: `${active.pos.x}%` }}
                  >
                    <span className="font-mono text-sm text-black">
                      {withSign(active.point.cumulativeProfit, formatMoney)}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(active.point.date)}</span>
                    {active.point.note && (
                      <span className="text-xs text-gray-500">{active.point.note}</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* X-axis labels */}
            <div className="relative h-4">
              {months.map((month) => (
                <span
                  key={`${month.label}-${month.x}`}
                  className="absolute -translate-x-1/2 font-mono text-[10px] text-gray-500"
                  style={{ left: `${month.x}%` }}
                >
                  {month.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default ProfitChart;
