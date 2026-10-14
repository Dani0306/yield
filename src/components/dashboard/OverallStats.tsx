import {
  formatMoney,
  formatPercent,
  formatUnits,
  withSign,
} from "@/lib/utils/fn";
import type { DashboardData } from "@/types";
import { Section, Stat, StatGrid, signClass } from "./DashboardUI";

const signedPercent = (value: number) =>
  withSign(value, (n) => formatPercent(n, 1));

const OverallStats = ({
  overview,
}: {
  overview: DashboardData["overview"];
}) => {
  const draws = Math.round(
    (overview.drawHitRatePercent / 100) * overview.settledBets,
  );

  return (
    <Section title="Overall">
      <StatGrid columns={6}>
        <Stat
          label="Current bank"
          value={formatMoney(overview.currentBank)}
          sub={`Budget ${formatMoney(overview.startingBank)}`}
        />
        <Stat
          label="Net profit"
          value={withSign(overview.netProfit, formatMoney)}
          valueClassName={signClass(overview.netProfit)}
          sub={withSign(overview.netProfitUnits, formatUnits)}
        />
        <Stat
          label="Bank growth"
          value={signedPercent(overview.bankGrowthPercent)}
          valueClassName={signClass(overview.bankGrowthPercent)}
          sub="on budget"
        />
        <Stat
          label="ROI"
          value={signedPercent(overview.roiPercent)}
          valueClassName={signClass(overview.roiPercent)}
          sub={`on ${formatMoney(overview.totalStaked)} staked`}
        />
        <Stat
          label="Draw hit rate"
          value={formatPercent(overview.drawHitRatePercent, 1)}
          sub={`${draws} of ${overview.settledBets} settled`}
        />
        <Stat
          label="Yield"
          value={
            overview.flatYieldPercent === null
              ? "–"
              : signedPercent(overview.flatYieldPercent)
          }
          valueClassName={
            overview.flatYieldPercent === null
              ? undefined
              : signClass(overview.flatYieldPercent)
          }
          sub={
            overview.settledAverageOdds === null
              ? "no settled bets yet"
              : `per bet, flat · average odds ${overview.settledAverageOdds.toFixed(2)}`
          }
        />
      </StatGrid>
    </Section>
  );
};

export default OverallStats;
