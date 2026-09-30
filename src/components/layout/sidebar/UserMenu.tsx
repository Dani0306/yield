"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronsUpDown,
  House,
  LogOut,
  Settings,
  User as UserIcon,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useSignOut } from "@/hooks/auth/useSignOut";
import type { User } from "@/types";
import { useOnClickOutside } from "usehooks-ts";
import { getFullName, getInitials } from "@/lib/utils/fn";

const menuItem =
  "flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-sm font-light text-black transition-colors hover:bg-gray-100";

type UserMenuProps = {
  user: User;
  onNavigate?: () => void;
};

const UserMenu = ({ user, onNavigate }: UserMenuProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPending, signOutFn } = useSignOut();
  const fullName = getFullName(user);

  useOnClickOutside(containerRef as React.RefObject<HTMLElement>, () =>
    setOpen(false),
  );

  const closeAndNavigate = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div ref={containerRef} className="relative">
      {open && (
        <div
          role="menu"
          className="absolute inset-x-0 bottom-full mb-2 border border-gray-200 bg-white py-1"
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={closeAndNavigate}
            className={menuItem}
          >
            <UserIcon size={16} strokeWidth={1.5} className="shrink-0" />
            Profile
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={closeAndNavigate}
            className={menuItem}
          >
            <Settings size={16} strokeWidth={1.5} className="shrink-0" />
            Settings
          </Link>
          <Link
            href="/"
            role="menuitem"
            onClick={closeAndNavigate}
            className={menuItem}
          >
            <House size={16} strokeWidth={1.5} className="shrink-0" />
            Home page
          </Link>
          <div className="my-1 border-t border-gray-200" />
          <button
            role="menuitem"
            onClick={signOutFn}
            disabled={isPending}
            className={`${menuItem} disabled:pointer-events-none disabled:opacity-50`}
          >
            <LogOut size={16} strokeWidth={1.5} className="shrink-0" />
            {isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-100"
      >
        <Avatar imageUrl={user.avatar_url} initials={getInitials(user)} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm text-black">{user.email}</span>
          {fullName && (
            <span className="truncate text-xs font-light text-gray-500">
              {fullName}
            </span>
          )}
        </span>
        <ChevronsUpDown
          size={14}
          strokeWidth={1.5}
          className="shrink-0 text-gray-500"
        />
      </button>
    </div>
  );
};

export default UserMenu;
