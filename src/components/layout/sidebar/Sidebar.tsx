"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { links } from "@/lib/data/links";
import type { User } from "@/types";
import UserMenu from "./UserMenu";

type SidebarProps = {
  user: User;
  onClose: () => void;
  onNavigate?: () => void;
};

// The most specific link matching the current path, so /bets/12 highlights
// "Bets" while /bets/new highlights "New bet".
const getActiveHref = (pathname: string) =>
  links
    .map((link) => link.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

const Sidebar = ({ user, onClose, onNavigate }: SidebarProps) => {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname);

  return (
    <nav
      aria-label="Main"
      className="flex h-full w-60 flex-col border-r border-gray-200 bg-[#FAFAFA]"
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo size="sm" />
        </Link>
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          className="cursor-pointer p-1.5 text-gray-900 transition-colors hover:text-black"
        >
          <PanelLeftClose size={18} strokeWidth={1.5} />
        </button>
      </div>

      <ul className="flex flex-col gap-0.5 px-3 py-4">
        {links.map(({ label, href, icon: Icon }) => {
          const isActive = href === activeHref;

          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2 text-sm text-black  transition-colors ${
                  isActive
                    ? "font-bold bg-gray-200/70"
                    : "font-light hover:bg-gray-100 hover:text-black"
                }`}
              >
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  className={`shrink-0 ${isActive && "font-bold text-black"}`}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto border-t border-gray-200 p-3">
        <UserMenu user={user} onNavigate={onNavigate} />
      </div>
    </nav>
  );
};

export default Sidebar;
