import "server-only";

import { createClient } from "@/lib/supabase/server";
import { findLiveScore } from "@/lib/scores/api";
import type { Bet, LiveScore } from "@/types";

type ScoredBet = Pick<
  Bet,
  "id" | "status" | "score" | "match_date" | "home_team" | "away_team"
>;

// The live score of a pending bet's match, or null for a settled bet.
// Costs nothing before kick-off or once the final score is saved: the API is
// only asked while the match can be running. When the API says the match
// is over, the final score is saved on the bet, ready for settling.
// Not a Server Action: call it from Server Components or other actions.
export const getBetLiveScore = async (
  bet: ScoredBet,
): Promise<LiveScore | null> => {
  if (bet.status !== "pending") return null;
  if (bet.score)
    return { state: "finished", score: bet.score, afterExtraTime: false };

  const kickOff = Date.parse(bet.match_date);
  if (Date.now() < kickOff) return { state: "not_started" };

  let live: LiveScore;
  try {
    live = await findLiveScore({
      homeTeam: bet.home_team,
      awayTeam: bet.away_team,
      kickOff,
    });
  } catch {
    return { state: "unavailable" };
  }

  if (live.state === "finished" && !live.afterExtraTime) {
    const supabase = await createClient();
    // Saving is a bonus: if it fails, the next look asks the API again.
    await supabase
      .from("bets")
      .update({ score: live.score })
      .eq("id", bet.id)
      .eq("status", "pending")
      .is("score", null);
  }

  return live;
};
