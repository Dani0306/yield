"use client";

import Link from "next/link";
import PageContainer from "../layout/PageContainer";
import { formatDate } from "@/lib/utils/fn";
import type { DashboardData } from "@/types";
import BetsTable from "../bets/BetsTable";
import { Section } from "./DashboardUI";
import OpenBets from "./OpenBets";
import NextEvent from "./NextEvent";
import OverallStats from "./OverallStats";
import EdgeCheck from "./EdgeCheck";
import Patterns from "./Patterns";
import ProfitChart from "./ProfitChart";

const DashboardContent = ({ data }: { data: DashboardData }) => {
  const {
    stake,
    openBets,
    overview,
    edge,
    patterns,
    nextEvent,
    profitOverTime,
    recentBets,
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
        <NextEvent event={nextEvent} stake={stake} />
        <OpenBets openBets={openBets} stake={stake} />
        <Patterns patterns={patterns} />
        <EdgeCheck
          edge={edge}
          settledBets={overview.settledBets}
          hitRateTimesOdds={overview.hitRateTimesOdds}
        />
        <Section
          title="Recent results"
          meta={
            <Link
              href="/bets"
              className="text-black underline-offset-4 hover:underline"
            >
              All bets
            </Link>
          }
        >
          <BetsTable bets={recentBets} emptyMessage="No settled bets yet" />
        </Section>
        <ProfitChart points={profitOverTime} />
      </div>
    </PageContainer>
  );
};

export default DashboardContent;
