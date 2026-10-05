"use client";

import PageContainer from "../layout/PageContainer";
import { formatDate } from "@/lib/utils/fn";
import type { DashboardData } from "@/types";
import CurrentProgression from "./CurrentProgression";
import NextEvent from "./NextEvent";
import OverallStats from "./OverallStats";
import EdgeCheck from "./EdgeCheck";
import Patterns from "./Patterns";
import ProgressionBetsTable from "./ProgressionBetsTable";
import ProfitChart from "./ProfitChart";
import PastProgressionsTable from "./PastProgressionsTable";

const DashboardContent = ({ data }: { data: DashboardData }) => {
  const {
    currentProgression,
    overview,
    edge,
    patterns,
    nextEvent,
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
        <OverallStats overview={overview} />
        <NextEvent
          event={nextEvent}
          nextStake={currentProgression?.nextStake ?? null}
        />
        <CurrentProgression
          progression={currentProgression}
          currentBank={overview.currentBank}
        />
        <Patterns patterns={patterns} />
        <EdgeCheck edge={edge} settledBets={overview.settledBets} />
        {currentProgression && (
          <ProgressionBetsTable
            progressionNumber={currentProgression.number}
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
