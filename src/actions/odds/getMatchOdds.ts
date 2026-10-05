import "server-only";

export const getMatchOdds = async () => {
  const res = await fetch(
    `https://api.oddspapi.io/v4/tournaments?sportId=10&apiKey=${process.env.ODDS_API_KEY}`,
    {
      next: { revalidate: 1800, tags: ["odds"] }, // reuse the response for 30 min
      signal: AbortSignal.timeout(8000), // don't hang the page
    },
  );

  if (!res.ok) throw new Error(`Odds API ${res.status}}`);

  return await res.json();
};
