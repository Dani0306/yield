import PageContainer from "../layout/PageContainer";
import ProgressionsTable from "./ProgressionsTable";
import type { ProgressionWithStats } from "@/types";

// Every progression so far, newest first, the active one included.
const ProgressionsContent = ({
  progressions,
}: {
  progressions: ProgressionWithStats[];
}) => (
  <PageContainer
    title="Progressions"
    description="Every progression so far."
    actions={
      <span className="text-xs text-gray-500">
        {progressions.length} total
      </span>
    }
  >
    <ProgressionsTable progressions={progressions} />
  </PageContainer>
);

export default ProgressionsContent;
