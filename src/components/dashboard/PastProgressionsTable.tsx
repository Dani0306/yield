import ProgressionsTable from "../progressions/ProgressionsTable";
import type { ProgressionWithStats } from "@/types";
import { Section } from "./DashboardUI";

const PastProgressionsTable = ({
  progressions,
}: {
  progressions: ProgressionWithStats[];
}) => (
  <Section title="Past progressions" meta={`Last ${progressions.length}`}>
    <ProgressionsTable
      progressions={progressions}
      emptyMessage="No finished progressions yet"
    />
  </Section>
);

export default PastProgressionsTable;
