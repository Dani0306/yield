import type { DashboardData } from "@/types";
import { resultLabels } from "@/lib/utils/bets";
import { Section, Stat, StatGrid } from "./DashboardUI";

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

const Patterns = ({ patterns }: { patterns: DashboardData["patterns"] }) => {
  const {
    averageOdds,
    averageWinningAttempt,
    wonBets,
    highestAttempt,
    topBookmakers,
    mostCommonScore,
    mostCommonDrawScore,
    averageGoals,
  } = patterns;

  return (
    <Section title="Patterns">
      <StatGrid columns={4}>
        {/* Seven cells: the list takes two slots (two rows tall on wide screens,
            full width at the bottom on phones) so the grid has no empty cell. */}
        <div className="flex min-w-0 flex-col gap-2 max-lg:order-last max-lg:col-span-2 lg:row-span-2">
          <span className="text-xs text-gray-500">Top bookmakers</span>
          {topBookmakers.length === 0 ? (
            <span className="font-mono text-xl text-black">–</span>
          ) : (
            <ol className="flex flex-col gap-1">
              {topBookmakers.map((bookmaker, index) => (
                <li
                  key={bookmaker.name}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="truncate text-black">
                    <span className="mr-2 font-mono text-xs text-gray-400">
                      {index + 1}
                    </span>
                    {bookmaker.name}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-gray-500">
                    {plural(bookmaker.bets, "bet")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <Stat
          label="Average odds"
          value={averageOdds === null ? "–" : averageOdds.toFixed(2)}
          sub={averageOdds === null ? "no bets yet" : "across all bets"}
        />
        <Stat
          label="Average winning attempt"
          value={
            averageWinningAttempt === null
              ? "–"
              : averageWinningAttempt.toFixed(1)
          }
          sub={wonBets ? `across ${plural(wonBets, "win")}` : "no wins yet"}
        />
        <Stat
          label="Highest attempt"
          value={highestAttempt?.attempt ?? "–"}
          sub={
            highestAttempt
              ? `in progression #${highestAttempt.progressionNumber}`
              : "no bets yet"
          }
        />
        <Stat
          label="Average goals per game"
          value={averageGoals === null ? "–" : averageGoals.perGame.toFixed(1)}
          sub={
            averageGoals
              ? `across ${plural(averageGoals.games, "game")}`
              : "no scores yet"
          }
        />
        <Stat
          label="Most common score"
          value={mostCommonScore?.score ?? "–"}
          sub={
            mostCommonScore
              ? `${resultLabels[mostCommonScore.result]} · ${mostCommonScore.count} of ${mostCommonScore.of}`
              : "no scores yet"
          }
        />
        <Stat
          label="Most common draw score"
          value={mostCommonDrawScore?.score ?? "–"}
          sub={
            mostCommonDrawScore
              ? `${mostCommonDrawScore.count} of ${plural(mostCommonDrawScore.of, "draw")}`
              : "no draws yet"
          }
        />
      </StatGrid>
    </Section>
  );
};

export default Patterns;
