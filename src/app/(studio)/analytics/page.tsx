import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { TrendBar } from "@/components/ui/trend-bar";
import { analyticsSnapshot, contentIdeas, personas, productAssets } from "@/data/mock-studio";
import { formatCompactNumber, formatPercent } from "@/lib/format";

const actionLinkClasses =
  "inline-flex items-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent";

export default function AnalyticsPage() {
  const highestTrendPoint = Math.max(...analyticsSnapshot.trend.map((item) => item.value));

  return (
    <>
      <PageHeader
        title="Analytics"
        description="A lightweight readout of what is performing best so the studio can keep refining future Reel concepts with more confidence."
        actions={
          <Link className={actionLinkClasses} href="/dashboard">
            Return to dashboard
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Views"
          value={formatCompactNumber(analyticsSnapshot.views)}
          change={analyticsSnapshot.timeframe}
          note="Overall reel reach across the placeholder reporting period."
        />
        <StatCard
          label="Saves"
          value={formatCompactNumber(analyticsSnapshot.saves)}
          change="+11% vs prior"
          note="A useful signal for educational or detail-first content."
        />
        <StatCard
          label="Share rate"
          value={formatPercent(analyticsSnapshot.shareRate)}
          change="+0.8 pts"
          note="Stronger when styling utility is obvious in the first few seconds."
        />
        <StatCard
          label="Conversion lift"
          value={formatPercent(analyticsSnapshot.conversionLift)}
          change="Persona-led"
          note="Lift from persona-structured content compared with generic product clips."
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Trend overview"
          description="Simple week-by-week momentum using lightweight visual bars instead of a chart library."
        >
          <div className="space-y-5">
            {analyticsSnapshot.trend.map((item) => (
              <TrendBar
                key={item.label}
                label={item.label}
                value={item.value}
                maxValue={highestTrendPoint}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Top personas"
          description="The personas currently creating the clearest lift for saves, clicks, or completion rate."
        >
          <div className="space-y-4">
            {analyticsSnapshot.topPersonas.map((persona) => (
              <div
                key={persona.name}
                className="rounded-[24px] border border-border/80 bg-white/75 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{persona.name}</p>
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                    +{persona.lift}% lift
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{persona.note}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          title="Top themes"
          description="Creative patterns that are worth reusing across future Instagram Reel campaigns."
        >
          <div className="space-y-4">
            {analyticsSnapshot.topThemes.map((theme) => (
              <div
                key={theme.label}
                className="rounded-[24px] border border-border/80 bg-accent-soft/35 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{theme.label}</p>
                  <span className="text-sm font-semibold text-accent">{theme.score}/100</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{theme.note}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Operational readout"
          description="A few quick reminders that connect performance back to the current content workflow."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-border/80 bg-white/75 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Approved personas
              </p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {personas.filter((persona) => persona.status === "Approved").length}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The current approved set is strong enough to cover styling, detail, and editorial angles.
              </p>
            </div>
            <div className="rounded-[24px] border border-border/80 bg-white/75 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Ready product assets
              </p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {productAssets.filter((product) => product.status === "Ready").length}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ready assets keep the studio moving faster from concept to publishable review cuts.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {analyticsSnapshot.notes.map((note) => (
              <div
                key={note}
                className="rounded-[22px] border border-border/80 bg-accent-soft/30 px-4 py-3 text-sm leading-6 text-muted-foreground"
              >
                {note}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[24px] border border-border/80 bg-white/75 p-4">
            <p className="text-sm font-semibold text-foreground">
              {contentIdeas.filter((idea) => idea.priority === "High").length} high-priority ideas are currently ready to refine next.
            </p>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
