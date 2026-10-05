// Sends the "kicks off in 10 minutes" email for each selected match that's
// due. Called every minute by the match-reminders pg_cron job, only when a
// reminder is due (see supabase/migrations/*_add_match_reminders.sql).
//
// Secrets (Edge Functions → Secrets in the Supabase dashboard):
//   RESEND_API_KEY  required
//   REMINDER_FROM   optional, defaults to Resend's test sender, which can
//                   only email the address the Resend account signed up with
//   APP_URL         optional, defaults to the production URL
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = Deno.env.get("REMINDER_FROM") ?? "Yield <onboarding@resend.dev>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://yield-sepia-one.vercel.app";

// Same staking rule as src/lib/utils/staking.ts.
const UNITS_PER_BANKROLL = 400;
const STAKE_MULTIPLIER = 1.5;
const BEST_ODDS_SHOWN = 3;

type Result = {
  id: number;
  home_team: string;
  away_team: string;
  league: string;
  draw_percentage: number;
  kick_off: string;
};
type Odds = { bookmaker: string; draw_odds: number; fetched_at: string };
type Stake = { units: number; amount: number; afterPending: boolean };

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

// ── Formatting (Colombian time and pesos, like the app) ──────
const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const time = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/Bogota",
  hour: "2-digit",
  minute: "2-digit",
});
const units = (n: number) => `${Number(n.toFixed(2))} u`;
const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

// ── Data ─────────────────────────────────────────────────────

// Everyone with reminders on (in practice, just you), with their email.
const getRecipients = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, total_budget")
    .eq("email_reminders", true);
  if (error) throw error;

  const recipients = [];
  for (const profile of data) {
    const { data: user } = await supabase.auth.admin.getUserById(profile.id);
    if (user.user?.email)
      recipients.push({ ...profile, email: user.user.email });
  }
  return recipients;
};

// The next bet's stake in the user's active progression: 1.5× per lost bet,
// assuming a pending bet loses too (as the dashboard shows it).
const getNextStake = async (
  userId: string,
  budget: number,
): Promise<Stake | null> => {
  if (budget <= 0) return null;
  const { data: progression } = await supabase
    .from("progressions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let losses = 0;
  let afterPending = false;
  if (progression) {
    const { data: bets, error } = await supabase
      .from("bets")
      .select("status")
      .eq("progression_id", progression.id);
    if (error) throw error;
    afterPending = bets.some((bet) => bet.status === "pending");
    losses =
      bets.filter((bet) => bet.status === "lost").length +
      (afterPending ? 1 : 0);
  }

  const stake = STAKE_MULTIPLIER ** losses;
  return {
    units: Math.round(stake * 100) / 100,
    amount: Math.round((stake * budget) / UNITS_PER_BANKROLL),
    afterPending,
  };
};

const getBestOdds = async (resultId: number): Promise<Odds[]> => {
  const { data, error } = await supabase
    .from("result_odds")
    .select("bookmaker, draw_odds, fetched_at")
    .eq("model_result_id", resultId)
    .order("draw_odds", { ascending: false })
    .limit(BEST_ODDS_SHOWN);
  if (error) throw error;
  return data;
};

// ── Email ────────────────────────────────────────────────────

const buildEmail = (result: Result, stake: Stake | null, odds: Odds[]) => {
  const kickOff = new Date(result.kick_off);
  const minutes = Math.max(
    1,
    Math.round((kickOff.getTime() - Date.now()) / 60_000),
  );
  const match = `${result.home_team} v ${result.away_team}`;
  const link = `${APP_URL}/draw-odds?filter=selected`;

  const rows: [string, string][] = [
    ["League", result.league],
    ["Your draw estimate", `${Number(result.draw_percentage).toFixed(1)}%`],
  ];
  if (stake)
    rows.push([
      stake.afterPending ? "Stake if your pending bet loses" : "Next stake",
      `${money.format(stake.amount)} · ${units(stake.units)}`,
    ]);
  for (const [i, o] of odds.entries())
    rows.push([
      i === 0 ? `Best draw odds (as of ${time.format(new Date(o.fetched_at))})` : "",
      `${o.bookmaker} ${Number(o.draw_odds).toFixed(2)}`,
    ]);

  const subject = `${match} kicks off in ${minutes} min`;

  const text = [
    `${match}`,
    `Kicks off at ${time.format(kickOff)} (in ${minutes} min)`,
    "",
    ...rows.map(([label, value]) => (label ? `${label}: ${value}` : `  ${value}`)),
    "",
    `Place the bet: ${link}`,
  ].join("\n");

  const cell = "padding:8px 0;border-top:1px solid #e5e5e5;font-size:14px;";
  const html = `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#ffffff;color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">
    <p style="margin:0 0 8px;font-size:12px;color:#737373;">Kick-off in ${minutes} min · ${time.format(kickOff)}</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:500;line-height:1.3;">${escape(match)}</h1>
    <table role="presentation" style="width:100%;border-collapse:collapse;border-bottom:1px solid #e5e5e5;">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="${cell}color:#737373;">${escape(label)}</td><td style="${cell}text-align:right;font-family:ui-monospace,Menlo,monospace;">${escape(value)}</td></tr>`,
        )
        .join("")}
    </table>
    <p style="margin:28px 0 0;">
      <a href="${link}" style="display:inline-block;padding:10px 18px;background:#000000;color:#ffffff;text-decoration:none;font-size:14px;border-radius:6px;">Place the bet</a>
    </p>
    <p style="margin:32px 0 0;font-size:12px;color:#a3a3a3;">Yield · You can turn these emails off in Settings.</p>
  </div>
</body></html>`;

  return { subject, text, html };
};

const sendEmail = async (
  to: string,
  email: { subject: string; text: string; html: string },
) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, ...email }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
};

// ── Handler ──────────────────────────────────────────────────

Deno.serve(async () => {
  // Checked before claiming, so nothing is marked as sent without a way to
  // send it.
  if (!RESEND_API_KEY)
    return Response.json({ error: "RESEND_API_KEY is not set" }, { status: 500 });

  const { data: due, error } = await supabase.rpc("claim_due_reminders");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!due?.length) return Response.json({ sent: 0 });

  const recipients = await getRecipients();
  const stakes = new Map(
    await Promise.all(
      recipients.map(
        async (r) => [r.id, await getNextStake(r.id, Number(r.total_budget))] as const,
      ),
    ),
  );

  let sent = 0;
  const failed: { id: number; error: string }[] = [];
  for (const result of due as Result[]) {
    try {
      const odds = await getBestOdds(result.id);
      for (const recipient of recipients) {
        await sendEmail(
          recipient.email,
          buildEmail(result, stakes.get(recipient.id) ?? null, odds),
        );
        sent++;
      }
    } catch (err) {
      // Not sent: clear the mark so the next minute tries again (until
      // kick-off).
      await supabase
        .from("model_results")
        .update({ reminder_sent_at: null })
        .eq("id", result.id);
      failed.push({ id: result.id, error: String(err) });
    }
  }

  if (failed.length) console.error("Reminders not sent", failed);
  return Response.json({ sent, failed }, { status: failed.length ? 500 : 200 });
});
