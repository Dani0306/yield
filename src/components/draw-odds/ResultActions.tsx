"use client";

import PageButton from "../ui/PageButton";
import { useModal } from "../providers/ModalProvider";
import { useSelectResult } from "@/hooks/results/useSelectResult";
import { kickOff } from "@/lib/utils/fn";
import { statusLabels } from "@/lib/utils/bets";
import type { ModelResult, ResultBet } from "@/types";

type ResultActionsProps = {
  result: ModelResult;
  // Runs after selecting or deselecting is saved, e.g. to close a modal
  // (the result then belongs to the other list).
  onChange?: () => void;
  // The selected match this one overlaps. Blocked results can't be selected.
  clash?: ModelResult | null;
  // The bet already placed from this result. It replaces the actions.
  bet?: ResultBet | null;
};

// Clicks and Enter/Space on these buttons stay here, so a clickable table
// row around them doesn't open its own action as well.
const stop = (e: React.SyntheticEvent) => e.stopPropagation();

// Unselected results can only be selected. Selected ones can be bet on, or
// deselected to send them back to the rest.
const ResultActions = ({
  result,
  onChange,
  clash,
  bet,
}: ResultActionsProps) => {
  const { setSelected, isPending } = useSelectResult();
  const { openModal } = useModal();
  const match = `${result.home_team} v ${result.away_team}`;

  if (isPending)
    return (
      <span className="text-xs text-gray-500">
        {result.added ? "Removing…" : "Selecting…"}
      </span>
    );

  // Already bet on: nothing left to do here but follow the bet.
  if (bet)
    return (
      <span
        className={`text-xs ${bet.status === "pending" ? "text-black" : "text-gray-500"}`}
      >
        Bet {statusLabels[bet.status].toLowerCase()}
      </span>
    );

  if (!result.added && clash)
    return (
      <span
        className="text-xs text-gray-500"
        title={`Overlaps ${clash.home_team} v ${clash.away_team}`}
      >
        Blocked
      </span>
    );

  if (!result.added)
    return (
      <span onClick={stop} onKeyDown={stop}>
        <PageButton
          text="Select"
          aria-label={`Select ${match}`}
          onClick={() => setSelected(result, true, onChange)}
          className="rounded-md px-3! py-1.5! text-xs"
        />
      </span>
    );

  return (
    <div
      onClick={stop}
      onKeyDown={stop}
      className="inline-flex items-center gap-3 max-md:flex-col-reverse max-md:items-end max-md:gap-1.5"
    >
      <button
        type="button"
        aria-label={`Deselect ${match}`}
        onClick={() => setSelected(result, false, onChange)}
        className="cursor-pointer text-xs text-gray-500 transition-colors hover:text-black"
      >
        Deselect
      </button>
      <PageButton
        text="Bet"
        aria-label={`Bet on ${match}`}
        onClick={() =>
          openModal("createBet", {
            homeTeam: result.home_team,
            awayTeam: result.away_team,
            matchDate: kickOff(result),
            drawPercentage: result.draw_percentage,
            modelResultId: result.id,
          })
        }
        className="rounded-md px-3! py-1.5! text-xs"
      />
    </div>
  );
};

export default ResultActions;
