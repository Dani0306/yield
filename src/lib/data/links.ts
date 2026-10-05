import {
  ChartColumn,
  LayoutDashboard,
  ReceiptText,
  Settings,
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
    label: "Draw odds",
    href: "/draw-odds",
    icon: ChartColumn,
    keywords: ["draw", "odds", "model", "predictions"],
  },
  {
    label: "Settings",
    href: "/bets/new",
    icon: Settings,
    keywords: ["settings"],
  },
];
