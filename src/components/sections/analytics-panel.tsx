"use client";

import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { TrendBar } from "@/components/ui/trend-bar";
import { formatPercent } from "@/lib/format";
import { useStudioAnalytics } from "@/lib/studio-data-provider";

function getMaxValue(values: number[]) {
  return Math.max(...values, 1);
}

export function AnalyticsPanel() {
  const { analyticsSnapshot: snapshot } = useStudioAnalytics();
  const highestWeeklyVolume = getMaxValue(
    snapshot.weeklyPostVolume.map((item) => item.value),
  );
  const highestContentTypeRate = getMaxValue(
    snapshot.contentTypePerformance.map((item) => item.engagementRate),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total posts"
          value={snapshot.totalPosts.toString()}
          change={snapshot.timeframe}
          note="All mock posts tracked in this internal reporting view."
        />
        <StatCard
          label="Approved posts"
          value={snapshot.approvedPosts.toString()}
          change={`${snapshot.approvedPosts}/${snapshot.totalPosts}`}
          note="Content that passed the current review and approval workflow."
        />
        <StatCard
          label="Engagement rate"
          value={formatPercent(snapshot.engagementRate)}
          change="Mock average"
          note="A simple rollup of likes, saves, shares, and comments."
        />

        <div className="rounded-[28px] border border-border/80 bg-white/78 p-5 shadow-[0_18px_45px_rgba(68,52,35,0.08)] backdrop-blur-sm">
          <p className="text-sm font-medium text-muted-foreground">Best persona</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-4xl font-semibold tracking-tight text-foreground">
              {snapshot.bestPersona}
            </p>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              Top performer
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The strongest mock persona for current engagement and approvals.
          </p>
        </div>

        <div className="rounded-[28px] border border-border/80 bg-white/78 p-5 shadow-[0_18px_45px_rgba(68,52,35,0.08)] backdrop-blur-sm">
          <p className="text-sm font-medium text-muted-foreground">Best content type</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-4xl font-semibold tracking-tight text-foreground">
              {snapshot.bestContentType}
            </p>
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              Leading format
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The content style currently creating the clearest performance lift.
          </p>
        </div>
      </div>

      <SectionCard
        title="Plain-English insights"
        description="A quick summary of what the mock data suggests so a business owner can act on it without reading charts first."
      >
        <div className="rounded-[24px] border border-accent/20 bg-accent-soft/35 px-5 py-5">
          <p className="text-lg font-semibold leading-8 text-foreground">
            {snapshot.insights[0]}
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.insights.slice(1).map((insight) => (
            <div
              className="rounded-[22px] border border-border/80 bg-white/75 px-4 py-4 text-sm leading-6 text-muted-foreground"
              key={insight}
            >
              {insight}
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Weekly post volume"
          description="A lightweight chart showing how many posts moved through the week."
        >
          <div className="space-y-5">
            {snapshot.weeklyPostVolume.map((item) => (
              <TrendBar
                key={item.label}
                label={item.label}
                value={item.value}
                maxValue={highestWeeklyVolume}
                helper={item.helper}
                valueLabel={`${item.value} posts`}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Best content types"
          description="Mock performance by content style so the studio can see which direction is working best."
        >
          <div className="space-y-5">
            {snapshot.contentTypePerformance.map((item) => (
              <div
                className="rounded-[24px] border border-border/80 bg-white/75 p-4"
                key={item.label}
              >
                <TrendBar
                  label={item.label}
                  value={item.engagementRate}
                  maxValue={highestContentTypeRate}
                  helper={`${item.approvedPosts} approved posts`}
                  valueLabel={formatPercent(item.engagementRate)}
                />
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Persona performance"
        description="A simple comparison of which mock personas are driving the strongest results right now."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.personaPerformance.map((persona) => (
            <div
              className="rounded-[24px] border border-border/80 bg-white/78 p-5"
              key={persona.name}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {persona.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {persona.approvedPosts} approved posts
                  </p>
                </div>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                  {formatPercent(persona.engagementRate)}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {persona.note}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
