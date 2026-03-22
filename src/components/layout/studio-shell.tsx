"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { studioNavigation } from "@/config/navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { StudioIcon } from "@/components/ui/studio-icon";

interface StudioShellProps {
  children: React.ReactNode;
}

export function StudioShell({ children }: StudioShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem =
    studioNavigation.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? studioNavigation[0];

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[300px] border-r border-border/70 lg:block">
          <SidebarNav items={studioNavigation} />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close navigation"
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              type="button"
            />
            <aside className="relative h-full w-[88%] max-w-[320px] border-r border-border/70">
              <SidebarNav items={studioNavigation} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-white/78 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  aria-label="Open navigation"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/80 bg-white/85 text-foreground lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  type="button"
                >
                  <StudioIcon className="h-5 w-5" name="menu" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                    Internal content studio
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                    {activeItem.label}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="rounded-full border border-border/80 bg-accent-soft/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {todayLabel}
                </div>
                <div className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white">
                  Mock workflow
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
