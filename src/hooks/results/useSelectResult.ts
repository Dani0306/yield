import { setResultAdded } from "@/actions/model_results/setResultAdded";
import { useTransition } from "react";
import type { ModelResult } from "@/types";

// Moves a result into the selected list, or back out of it.
export const useSelectResult = () => {
  const [isPending, startTransition] = useTransition();

  // onDone runs once the change is saved, e.g. to close a modal.
  const setSelected = (
    result: ModelResult,
    added: boolean,
    onDone?: () => void,
  ) => {
    startTransition(async () => {
      // Awaited, so isPending stays true until the list has refreshed.
      await setResultAdded(
        {
          match_date: result.match_date,
          home_team: result.home_team,
          away_team: result.away_team,
          scraped_at: result.scraped_at,
        },
        added,
      );
      onDone?.();
    });
  };

  return { isPending, setSelected };
};
