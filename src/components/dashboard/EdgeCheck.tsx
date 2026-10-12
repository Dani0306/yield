import { formatPercent, withSign } from "@/lib/utils/fn";
import type { DashboardData } from "@/types";
import { Section } from "./DashboardUI";

const Bar = ({
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
    <span className="w-16 shrink-0 text-xs text-gray-500">{label}</span>
    <div className="h-1 flex-1 bg-gray-100">
      <div
        className={`h-full ${fillClassName}`}
        style={{ width: `${Math.min((value / scaleMax) * 100, 100)}%` }}
      />
    </div>
    <span className="w-14 shrink-0 text-right font-mono text-xs text-black">
      {formatPercent(value, 1)}
    </span>
  </div>
);

// The edge test: hit rate × average odds needs this many settled bets
// before it says much, and this much above break-even (1.00) to count as an
// edge rather than luck.
const EDGE_TEST_BETS = 300;
const EDGE_TARGET = 1.03;

// What the figure means so far, in a sentence.
const edgeVerdict = (factor: number | null, settledBets: number) => {
  if (factor === null) return "Settle your first bets to start the test.";
  const figure = factor.toFixed(2);
  if (settledBets < EDGE_TEST_BETS)
    return `${figure} so far, but ${EDGE_TEST_BETS - settledBets} more settled bets are needed before it means much: keep the stake flat.`;
  if (factor >= EDGE_TARGET)
    return `${figure}: likely a real edge. Keep going.`;
  if (factor >= 1)
    return `${figure}: too close to tell. Keep collecting at the same stake.`;
  return `${figure}: no edge yet. Stop and rework the model before staking more.`;
};

const EdgeTest = ({
  factor,
  settledBets,
}: {
  factor: number | null;
  settledBets: number;
}) => (
  <div className="flex flex-col gap-3 border-b border-gray-200 pb-6">
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-gray-500">
        Hit rate × odds over {EDGE_TEST_BETS} settled bets · target{" "}
        {EDGE_TARGET.toFixed(2)}
      </span>
      <span className="shrink-0 font-mono text-xs text-black">
        {Math.min(settledBets, EDGE_TEST_BETS)} / {EDGE_TEST_BETS}
      </span>
    </div>
    <div className="h-1 bg-gray-100">
      <div
        className="h-full bg-black"
        style={{
          width: `${Math.min((settledBets / EDGE_TEST_BETS) * 100, 100)}%`,
        }}
      />
    </div>
    <p className="text-xs text-gray-500">{edgeVerdict(factor, settledBets)}</p>
  </div>
);

const EdgeCheck = ({
  edge,
  settledBets,
  hitRateTimesOdds,
}: {
  edge: DashboardData["edge"];
  settledBets: number;
  hitRateTimesOdds: number | null;
}) => {
  const { estimatedDrawRatePercent: estimated, actualDrawRatePercent: actual } =
    edge;
  // Bars share a scale with headroom, so the difference is easy to see.
  const scaleMax = Math.max(
    50,
    Math.ceil(Math.max(estimated, actual) / 10) * 10,
  );
  const gap = edge.drawRateGapPercent;
  const gapMeaning =
    gap < 0
      ? "draws are landing less often than the model estimates"
      : gap > 0
        ? "draws are landing more often than the model estimates"
        : "draws are landing as often as the model estimates";

  return (
    <Section title="Edge check">
      <EdgeTest factor={hitRateTimesOdds} settledBets={settledBets} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          <span className="text-xs text-gray-500">
            Estimated vs actual draw rate
          </span>
          <Bar
            label="Estimated"
            value={estimated}
            scaleMax={scaleMax}
            fillClassName="bg-gray-400"
          />
          <Bar
            label="Actual"
            value={actual}
            scaleMax={scaleMax}
            fillClassName="bg-black"
          />
          <p className="text-xs text-gray-500">
            Gap{" "}
            <span className="font-mono text-black">
              {withSign(gap, (n) => n.toFixed(2))} pts
            </span>{" "}
            · {gapMeaning}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-4 border-t border-gray-200 pt-4 lg:flex-col lg:justify-start lg:gap-2 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <span className="text-xs text-gray-500">Average advantage</span>
          <div className="flex flex-col items-end gap-1 lg:items-start">
            <span className="font-mono text-2xl tracking-tight text-black max-lg:text-sm">
              {withSign(edge.averageAdvantagePercent, (n) => formatPercent(n))}
            </span>
            <span className="text-xs text-gray-500">
              across {settledBets} settled bets
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default EdgeCheck;
