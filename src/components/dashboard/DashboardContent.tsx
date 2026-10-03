"use client";

import PageContainer from "../layout/PageContainer";
import { formatDate } from "@/lib/utils/fn";
import type { DashboardData } from "@/types";
import CurrentProgression from "./CurrentProgression";
import OverallStats from "./OverallStats";
import EdgeCheck from "./EdgeCheck";
import ProgressionBetsTable from "./ProgressionBetsTable";
import ProfitChart from "./ProfitChart";
import PastProgressionsTable from "./PastProgressionsTable";

const DashboardContent = ({ data }: { data: DashboardData }) => {
  const {
    currentProgression,
    overview,
    edge,
    profitOverTime,
    recentProgressions,
  } = data;

  return (
    <PageContainer
      title="Dashboard"
      description="Your strategy at a glance."
      actions={
        <span className="text-xs text-gray-500">
          {formatDate(new Date().toISOString())}
        </span>
      }
    >
      <div className="flex flex-col gap-14">
        <CurrentProgression
          progression={currentProgression}
          currentBank={overview.currentBank}
        />
        <OverallStats overview={overview} />
        <EdgeCheck edge={edge} settledBets={overview.settledBets} />
        {currentProgression && (
          <ProgressionBetsTable
            progressionId={currentProgression.id}
            bets={currentProgression.bets}
          />
        )}
        <ProfitChart points={profitOverTime} />
        <PastProgressionsTable progressions={recentProgressions} />
      </div>
    </PageContainer>
  );
};

export default DashboardContent;
