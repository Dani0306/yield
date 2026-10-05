"use client";

import { useState, useTransition } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { BOOKMAKERS } from "@/lib/data/bookmakers";
import PageButton from "../ui/PageButton";
import { createBet } from "@/actions/bets/createBet";
import { formatPercent, withSign } from "@/lib/utils/fn";

type CreateBetProps = {
  onClose: () => void;
  // Prefills, e.g. from a row on the Draw odds page.
  homeTeam?: string;
  awayTeam?: string;
  // Local date and time as "YYYY-MM-DDTHH:MM" (what a datetime input takes).
  matchDate?: string;
  drawPercentage?: number;
  // The Draw odds result this bet comes from, so the result shows its bet.
  modelResultId?: number;
};

// Muted green/red for the advantage; neutral when zero.
const signClass = (value: number) =>
  value > 0 ? "text-green-700" : value < 0 ? "text-red-700" : "text-black";

// Only what the user decides. The progression, attempt, stake and amount
// come from the staking rule on the server; the advantage is calculated by
// the database.
const CreateBet = ({
  onClose,
  homeTeam = "",
  awayTeam = "",
  matchDate = "",
  drawPercentage,
  modelResultId,
}: CreateBetProps) => {
  const [home, setHome] = useState(homeTeam);
  const [away, setAway] = useState(awayTeam);
  const [date, setDate] = useState(matchDate);
  const [bookmaker, setBookmaker] = useState("");
  const [odds, setOdds] = useState("");
  const [estimate, setEstimate] = useState(
    // Bets store 2 decimals (36.8389 → 36.84).
    drawPercentage === undefined
      ? ""
      : String(Math.round(drawPercentage * 100) / 100),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Live comparison once both numbers make sense.
  const oddsValue = Number(odds);
  const estimateValue = Number(estimate);
  const implied = odds && oddsValue > 1 ? 100 / oddsValue : null;
  const advantage =
    implied !== null && estimate !== "" ? estimateValue - implied : null;

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date) return setError("Enter the match date and time");
    if (!bookmaker) return setError("Choose a bookmaker");

    startTransition(async () => {
      setError(null);
      const { error } = await createBet({
        // The input's value has no time zone: read it in the browser's,
        // so the server stores the moment the user meant.
        match_date: new Date(date).toISOString(),
        home_team: home,
        away_team: away,
        odds: oddsValue,
        draw_percentage: estimateValue,
        bookmaker,
        model_result_id: modelResultId,
      });
      if (error) return setError(error);
      onClose();
    });
  };

  return (
    <Modal
      size="md"
      title="New bet"
      description="Stake and amount follow your progression automatically."
      onClose={() => !isPending && onClose()}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Date & time"
          name="match_date"
          type="datetime-local"
          value={date}
          setValue={setDate}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Home team"
            name="home_team"
            type="text"
            value={home}
            setValue={setHome}
          />
          <Input
            label="Away team"
            name="away_team"
            type="text"
            value={away}
            setValue={setAway}
          />
        </div>
        <Select
          label="Bookmaker"
          name="bookmaker"
          value={bookmaker}
          setValue={setBookmaker}
          options={BOOKMAKERS}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Odds (decimal)"
            name="odds"
            type="number"
            value={odds}
            setValue={setOdds}
          />
          <Input
            label="Your draw estimate (%)"
            name="draw_percentage"
            type="number"
            value={estimate}
            setValue={setEstimate}
          />
        </div>

        <div className="grid grid-cols-2 divide-x divide-gray-200 border-y border-gray-200">
          <div className="flex flex-col gap-1.5 py-4 pr-4">
            <span className="text-xs text-gray-500">Implied by odds</span>
            <span className="font-mono text-xl tracking-tight text-gray-500">
              {implied === null ? "–" : formatPercent(implied, 1)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 py-4 pl-4">
            <span className="text-xs text-gray-500">Advantage</span>
            <span
              className={`font-mono text-xl tracking-tight ${
                advantage === null ? "text-gray-500" : signClass(advantage)
              }`}
            >
              {advantage === null
                ? "-"
                : withSign(advantage, (n) => `${n.toFixed(1)} pts`)}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex items-center gap-4">
          <PageButton
            type="submit"
            text={isPending ? "Saving…" : "Save bet"}
            disabled={isPending}
            className="rounded-md px-5"
          />
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer text-sm text-gray-500 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBet;
