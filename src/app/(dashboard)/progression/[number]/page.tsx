import { notFound } from "next/navigation";
import { getProgression } from "@/actions/progressions/getProgression";
import ProgressionContent from "@/components/progressions/ProgressionContent";
import ErrorScreen from "@/components/layout/error/ErrorScreen";
import { tryCatch } from "@/lib/utils/tryCatch";

// /progression/2 is your Progression #2 (its number, not its database id).
const page = async ({ params }: { params: Promise<{ number: string }> }) => {
  const { number } = await params;
  const progressionNumber = Number(number);

  // /progression/abc or /progression/0 can't be a progression.
  if (!Number.isInteger(progressionNumber) || progressionNumber <= 0)
    notFound();

  const [data, error] = await tryCatch(getProgression(progressionNumber));

  if (error) return <ErrorScreen error={error} />;
  if (!data) notFound();

  return <ProgressionContent progression={data.progression} bets={data.bets} />;
};

export default page;
