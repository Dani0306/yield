import { getProgressions } from "@/actions/progressions/getProgressions";
import ProgressionsContent from "@/components/progressions/ProgressionsContent";
import ErrorScreen from "@/components/layout/error/ErrorScreen";
import { tryCatch } from "@/lib/utils/tryCatch";

const page = async () => {
  const [progressions, error] = await tryCatch(getProgressions());

  if (error) return <ErrorScreen error={error} />;

  return <ProgressionsContent progressions={progressions} />;
};

export default page;
