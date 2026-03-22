"use client";

import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatShortDate } from "@/lib/format";
import { useStudioAnalytics } from "@/lib/studio-data-provider";

function getSystemToneClasses(tone: "success" | "warning" | "neutral") {
  if (tone === "success") {
    return "border-success/20 bg-success/10 text-success";
  }

  if (tone === "warning") {
    return "border-warning/20 bg-warning/10 text-warning";
  }

  return "border-border/80 bg-white text-muted-foreground";
}

export function DashboardPanel() {
  const { dashboardSummary, systemStatus } = useStudioAnalytics();
  const { stats, upcomingPublishes, urgentReviews, freshIdeas, brandProfile } =
    dashboardSummary;
  const statusItems =
    systemStatus.length > 0
      ? systemStatus
      : [
          { id: "ai", label: "AI", value: "Mock Connected", tone: "success" as const },
          {
            id: "video",
            label: "Video Engine",
            value: "Mock Connected",
            tone: "success" as const,
          },
          {
            id: "publishing",
            label: "Publishing",
            value: "Not Connected",
            tone: "warning" as const,
          },
        ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            note={stat.note}
          />
        ))}

        <SectionCard
          title="System status"
          description="Current integration readiness"
          className="md:col-span-2 xl:col-span-1"
        >
          <div className="space-y-3">
            {statusItems.map((item) => (
              <div
                className="flex items-center justify-between gap-3 rounded-[18px] border border-border/80 bg-white/75 px-3 py-2"
                key={item.id}
              >
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getSystemToneClasses(item.tone)}`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Campaign pulse"
          description="The next scheduled or nearly scheduled Instagram Reels in the pipeline."
        >
          <div className="space-y-4">
            {upcomingPublishes.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-border/80 bg-white/75 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.campaign} · {item.personaName}
                    </p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span>Product: {item.productName}</span>
                  <span>Owner: {item.owner}</span>
                  <span>Publishes: {formatDateTime(item.scheduledFor)}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Review priorities"
          description="Items that still need a human decision before they can move into the publishing queue."
        >
          <div className="space-y-4">
            {urgentReviews.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-border/80 bg-accent-soft/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.conceptTitle}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.personaName} · edited by {item.editor}
                    </p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.notes}</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span>Due {formatShortDate(item.dueDate)}</span>
                  <span>Reviewer: {item.reviewer}</span>
                  <span>Runtime: {item.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_0.95fr]">
        <SectionCard
          title="Fresh content ideas"
          description="The next concept directions the team can turn into scripts or shot lists."
        >
          <div className="space-y-4">
            {freshIdeas.map((idea) => (
              <div
                key={idea.id}
                className="rounded-[24px] border border-border/80 bg-white/75 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="mr-auto font-semibold text-foreground">{idea.title}</p>
                  <StatusBadge value={idea.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{idea.hook}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {idea.products.map((product) => (
                    <span
                      key={product}
                      className="rounded-full border border-border/80 bg-accent-soft/35 px-3 py-1 text-xs font-semibold text-foreground"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Brand snapshot"
          description="A quick reference for the core business profile the studio should follow while planning content."
        >
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Style keywords
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {brandProfile.styleKeywords.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] border border-border/80 bg-white/75 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Preferred colors
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {brandProfile.preferredColors.join(", ")}
                </p>
              </div>
              <div className="rounded-[22px] border border-border/80 bg-white/75 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Product categories
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {brandProfile.productCategories.join(", ")}
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-border/80 bg-accent-soft/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Do not use
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                {brandProfile.doNotUseList.slice(0, 3).join(", ")}
              </p>
            </div>

            <div className="rounded-[24px] border border-border/80 bg-white/75 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Instagram handle
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                {brandProfile.instagramHandle}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
