import { formatMoney, formatPercent, formatUnits, withSign } from "@/lib/utils/fn";
import type { DashboardData } from "@/types";
import { Section, Stat, StatGrid, signClass } from "./DashboardUI";

const signedPercent = (value: number) => withSign(value, (n) => formatPercent(n, 1));

const OverallStats = ({ overview }: { overview: DashboardData["overview"] }) => {
  const draws = Math.round((overview.drawHitRatePercent / 100) * overview.settledBets);

  return (
    <Section title="Overall">
      <StatGrid columns={6}>
        <Stat
          label="Net profit"
          value={withSign(overview.netProfit, formatMoney)}
          valueClassName={signClass(overview.netProfit)}
          sub={withSign(overview.netProfitUnits, formatUnits)}
        />
        <Stat
          label="Current bank"
          value={formatMoney(overview.currentBank)}
          sub={`Budget ${formatMoney(overview.startingBank)}`}
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
          label="Progressions"
          value={overview.progressionsCompleted}
          sub={`completed · ${overview.progressionsAbandoned} abandoned`}
        />
      </StatGrid>
    </Section>
  );
};

export default OverallStats;
