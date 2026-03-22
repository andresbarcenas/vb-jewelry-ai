import Link from "next/link";
import { DashboardPanel } from "@/components/sections/dashboard-panel";
import { PageHeader } from "@/components/ui/page-header";

const actionLinkClasses =
  "inline-flex items-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A calm overview of what is approved, what needs review next, and which content concepts are closest to publish-ready."
        actions={
          <>
            <Link className={actionLinkClasses} href="/content-ideas">
              Review ideas
            </Link>
            <Link className={actionLinkClasses} href="/video-review-queue">
              Open review queue
            </Link>
          </>
        }
      />
      <DashboardPanel />
    </>
  );
}
