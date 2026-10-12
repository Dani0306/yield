import Link from "next/link";
import PageContainer from "../layout/PageContainer";
import ProgressionsTable from "./ProgressionsTable";
import type { ProgressionWithStats } from "@/types";

// The progressions played before the switch to flat stakes, newest first.
// History only: new bets don't belong to one.
const ProgressionsContent = ({
  progressions,
}: {
  progressions: ProgressionWithStats[];
}) => (
  <PageContainer
    title="Progressions"
    description="The progressions played before switching to flat stakes."
    actions={
      <Link
        href="/bets"
        className="text-xs text-gray-500 transition-colors hover:text-black"
      >
        ← Bets · {progressions.length} total
      </Link>
    }
  >
    <ProgressionsTable progressions={progressions} />
  </PageContainer>
);

export default ProgressionsContent;
