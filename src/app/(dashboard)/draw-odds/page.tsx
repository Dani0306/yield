import { getModelResults } from "@/actions/model_results/getModelResults";
import { getResultBets } from "@/actions/bets/getResultBets";
import DrawOddsContent from "@/components/draw-odds/DrawOddsContent";
import ErrorScreen from "@/components/layout/error/ErrorScreen";
import { tryCatch } from "@/lib/utils/tryCatch";
import type { ModelResult, SearchParamProps } from "@/types";
import { getResultOdds } from "@/actions/odds/getResultOdds";

const page = async ({ searchParams }: SearchParamProps) => {
  const params = await searchParams;
  const showingSelected = params?.filter === "selected";

  // The selected results are always needed: they block the unselected
  // matches that overlap them.
  const [[results, error], [selected, selectedError]] = await Promise.all([
    tryCatch(getModelResults(params?.filter)),
    showingSelected
      ? Promise.resolve([[] as ModelResult[], null] as const)
      : tryCatch(getModelResults("selected")),
  ]);

  if (error) return <ErrorScreen error={error} />;
  if (selectedError) return <ErrorScreen error={selectedError} />;

  // Results you've already bet on show the bet's status instead of actions;
  // selected ones carry their bookmaker odds into the new bet form.
  const selectedResults = showingSelected ? results : selected;
  const [[bets, betsError], [odds, oddsError]] = await Promise.all([
    tryCatch(getResultBets(results.map((r) => r.id))),
    tryCatch(getResultOdds(selectedResults.map((r) => r.id))),
  ]);
  if (betsError) return <ErrorScreen error={betsError} />;
  if (oddsError) return <ErrorScreen error={oddsError} />;

  return (
    <DrawOddsContent
      results={results}
      selected={selectedResults}
      bets={bets}
      odds={odds}
    />
  );
};

export default page;
