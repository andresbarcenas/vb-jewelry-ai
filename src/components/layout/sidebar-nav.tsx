"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types/studio";
import { StudioIcon } from "@/components/ui/studio-icon";

interface SidebarNavProps {
  items: NavItem[];
  onNavigate?: () => void;
}

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-white/82 p-5 backdrop-blur-xl">
      <div className="rounded-[30px] border border-border/80 bg-[linear-gradient(160deg,rgba(236,224,207,0.75),rgba(255,255,255,0.95))] p-5 shadow-[0_18px_45px_rgba(68,52,35,0.1)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Internal admin tool
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-foreground">
          VB Jewelry
        </h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">AI Studio</p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Build and review AI-assisted Instagram Reel campaigns using approved personas and product assets.
        </p>
      </div>

      <nav className="mt-6 space-y-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                active
                  ? "border-accent/20 bg-accent text-white shadow-[0_14px_30px_rgba(143,108,69,0.2)]"
                  : "border-transparent bg-transparent hover:border-border/80 hover:bg-white/75"
              }`}
            >
              <span
                className={`mt-0.5 rounded-2xl p-2 ${
                  active ? "bg-white/16" : "bg-accent-soft/55 text-accent"
                }`}
              >
                <StudioIcon
                  className="h-4 w-4"
                  name={item.icon}
                />
              </span>
              <span>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span
                  className={`mt-1 block text-xs leading-5 ${
                    active ? "text-white/80" : "text-muted-foreground"
                  }`}
                >
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[26px] border border-border/80 bg-accent-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Workflow note
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground">
          This first version uses local placeholder state only, so changes are safe to explore without publishing anything.
        </p>
      </div>
    </div>
  );
}
