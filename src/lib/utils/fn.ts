import { ModelResult, User } from "@/types";

// * Get profile initials
export const getInitials = ({ first_name, last_name, email }: User) => {
  const initials = `${first_name?.[0] ?? ""}${last_name?.[0] ?? ""}`;
  return (initials || email[0] || "?").toUpperCase();
};
// * Get full name
export const getFullName = ({ first_name, last_name }: User) =>
  [first_name, last_name].filter(Boolean).join(" ");

// * Format money in Colombian pesos, e.g. $ 1.240.500
// Whole pesos only: cents aren't used in practice.
const moneyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
export const formatMoney = (value: number) => moneyFormatter.format(value);

// * Add an explicit + or − sign, e.g. +$ 48.000, −$ 10.000
export const withSign = (value: number, format: (n: number) => string) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${format(Math.abs(value))}`;

// * Format a date, e.g. Wed 30 Sep, 2026
// Built from parts: no locale produces this exact order and punctuation.
// All dates are shown in Colombian time, so the server and the browser
// always format the same date the same way (no hydration mismatches).
const TIME_ZONE = "America/Bogota";

const dateParts = (iso: string, formatter: Intl.DateTimeFormat) =>
  Object.fromEntries(
    formatter
      .formatToParts(new Date(iso))
      .map(({ type, value }) => [type, value]),
  );

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});
export const formatDate = (iso: string) => {
  const parts = dateParts(iso, dateFormatter);
  return `${parts.weekday} ${parts.day} ${parts.month}, ${parts.year}`;
};

// * Format a date with its time, e.g. Wed 30 Sep, 2026 · 13:00
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});
export const formatDateTime = (iso: string) => {
  const parts = dateParts(iso, timeFormatter);
  return `${formatDate(iso)} · ${parts.hour}:${parts.minute}`;
};

// * Format a short date without the year, e.g. 27 Sep
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  timeZone: TIME_ZONE,
});
export const formatShortDate = (iso: string) => {
  const parts = dateParts(iso, shortDateFormatter);
  return `${parts.day} ${parts.month}`;
};

// * Format a date with its weekday, without the year, e.g. Sat 12 Sep
const dayDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: TIME_ZONE,
});
export const formatDayDate = (iso: string) => {
  const parts = dateParts(iso, dayDateFormatter);
  return `${parts.weekday} ${parts.day} ${parts.month}`;
};

// * Format a date range, e.g. 07 – 08 Sep, 30 Aug – 02 Sep, or 06 Sep
export const formatDateRange = (startIso: string, endIso: string | null) => {
  const start = dateParts(startIso, shortDateFormatter);
  if (!endIso) return `${start.day} ${start.month} – now`;
  const end = dateParts(endIso, shortDateFormatter);
  if (start.day === end.day && start.month === end.month)
    return `${end.day} ${end.month}`;
  if (start.month === end.month)
    return `${start.day} – ${end.day} ${end.month}`;
  return `${start.day} ${start.month} – ${end.day} ${end.month}`;
};

// * Format the model's kick-off ("DD.MM. HH:MM"), e.g. 03.10. 13:00 → Oct 3, 13:00
// Read straight from the text: it has no year or time zone, so turning it
// into a Date would guess both. Unexpected text is returned as it came.
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const formatGameDate = (gameDate: string) => {
  const match = gameDate
    .trim()
    .match(/^(\d{1,2})\.(\d{1,2})\.\s*(\d{1,2}):(\d{2})$/);
  if (!match) return gameDate;

  const [, day, month, hour, minute] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName || Number(day) < 1 || Number(day) > 31) return gameDate;

  return `${monthName} ${Number(day)}, ${hour.padStart(2, "0")}:${minute}`;
};

// * Format a month label for chart axes, e.g. Sep
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: TIME_ZONE,
});
export const formatMonth = (iso: string) =>
  monthFormatter.format(new Date(iso));

// * Format money compactly for chart axes, e.g. $50 K, $1,5 M
// Built by hand: Intl's compact notation differs between Node and browsers
// ("k" vs "K"), which breaks hydration.
export const formatMoneyCompact = (value: number) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  // One decimal at most, with a Colombian decimal comma: 1.5 → "1,5".
  const short = (n: number) => String(Number(n.toFixed(1))).replace(".", ",");
  if (abs >= 1_000_000) return `${sign}$${short(abs / 1_000_000)} M`;
  if (abs >= 1_000) return `${sign}$${short(abs / 1_000)} K`;
  return `${sign}$ ${abs}`;
};

// * Format units, e.g. 8.5 u
export const formatUnits = (value: number) => `${Number(value.toFixed(2))} u`;

// * Format a percentage, e.g. 4.14%
export const formatPercent = (value: number, digits = 2) =>
  `${value.toFixed(digits)}%`;

// * Kick-off

// The kick-off as a datetime input value: the date from match_date, the
// time from game_date ("03.10. 13:00"). Date only when there's no time.

// * Whether a result's match has already kicked off. Times are Colombian
// (UTC−5 all year, no daylight saving).
export const hasKickedOff = (r: ModelResult, now: number) =>
  Date.parse(`${kickOff(r)}:00-05:00`) <= now;

export const kickOff = (r: ModelResult) => {
  const time = r.game_date.match(/(\d{1,2}):(\d{2})\s*$/);
  return time
    ? `${r.match_date}T${time[1].padStart(2, "0")}:${time[2]}`
    : `${r.match_date}T00:00`;
};
