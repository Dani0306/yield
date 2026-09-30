import { User } from "@/types";

// * Get profile initials
export const getInitials = ({ first_name, last_name, email }: User) => {
  const initials = `${first_name?.[0] ?? ""}${last_name?.[0] ?? ""}`;
  return (initials || email[0] || "?").toUpperCase();
};
// * Get full name
export const getFullName = ({ first_name, last_name }: User) =>
  [first_name, last_name].filter(Boolean).join(" ");

// * Format money, e.g. €1,240.50
const moneyFormatter = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "EUR",
});
export const formatMoney = (value: number) => moneyFormatter.format(value);

// * Add an explicit + or − sign, e.g. +€48.00, −€10.00
export const withSign = (value: number, format: (n: number) => string) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${format(Math.abs(value))}`;

// * Format a date, e.g. 02 Aug 2026
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
export const formatDate = (iso: string) => dateFormatter.format(new Date(iso));

// * Format a short date without the year, e.g. 27 Sep
const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});
export const formatShortDate = (iso: string) =>
  shortDateFormatter.format(new Date(iso));
