"use client";

import { useEffect, useState } from "react";
import { Menu, PanelLeftOpen } from "lucide-react";
import Sidebar from "./Sidebar";
import type { User } from "@/types";

const iconButton =
  "cursor-pointer p-1.5 text-gray-500 transition-colors hover:text-black";

type DashboardShellProps = {
  user: User;
  children: React.ReactNode;
};

const DashboardShell = ({ user, children }: DashboardShellProps) => {
  // Desktop: sidebar sits beside the content and starts open.
  // Mobile: sidebar slides over the content and starts closed.
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh flex-1">
      {/* Desktop */}
      <aside
        inert={!desktopOpen}
        className={`sticky top-0 hidden h-dvh shrink-0 overflow-hidden transition-[width] duration-300 md:block ${
          desktopOpen ? "w-60" : "w-0"
        }`}
      >
        <Sidebar user={user} onClose={() => setDesktopOpen(false)} />
      </aside>

      {/* Mobile */}
      <div
        aria-hidden
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        inert={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          user={user}
          onClose={() => setMobileOpen(false)}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center px-4">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
            className={`${iconButton} md:hidden`}
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
          {!desktopOpen && (
            <button
              onClick={() => setDesktopOpen(true)}
              aria-label="Open sidebar"
              className={`${iconButton} hidden md:inline-flex`}
            >
              <PanelLeftOpen size={18} strokeWidth={1.5} />
            </button>
          )}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
