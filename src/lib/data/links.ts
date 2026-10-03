import {
  ChartColumn,
  LayoutDashboard,
  Plus,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords: string[];
};

export const links: NavLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["dashboard", "home", "overview", "summary"],
  },
  {
    label: "Bets",
    href: "/bets",
    icon: ReceiptText,
    keywords: ["bets", "history", "log", "list"],
  },
  {
    label: "New bet",
    href: "/bets/new",
    icon: Plus,
    keywords: ["new", "add", "create", "place", "bet"],
  },
  {
    label: "Draw odds",
    href: "/draw-odds",
    icon: ChartColumn,
    keywords: ["draw", "odds", "model", "predictions"],
  },

  // {
  //   label: "Stats",
  //   href: "/stats",
  //   icon: ChartColumn,
  //   keywords: ["stats", "statistics", "analytics", "roi", "profit", "charts"],
  // },
];
