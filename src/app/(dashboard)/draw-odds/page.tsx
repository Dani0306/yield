import { getModelResults } from "@/actions/model_results/getModelResults";
import DrawOddsContent from "@/components/draw-odds/DrawOddsContent";
import ErrorScreen from "@/components/layout/error/ErrorScreen";
import { tryCatch } from "@/lib/utils/tryCatch";
import { SearchParamProps } from "@/types";

const page = async ({ searchParams }: SearchParamProps) => {
  const params = await searchParams;
  const [results, error] = await tryCatch(getModelResults(params?.filter));

  if (error) return <ErrorScreen error={error} />;

  return <DrawOddsContent results={results} />;
};

export default page;
