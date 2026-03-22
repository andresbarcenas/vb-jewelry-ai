import { AnalyticsPanel } from "@/components/sections/analytics-panel";
import { PageHeader } from "@/components/ui/page-header";
import { analyticsSnapshot } from "@/data/mock-studio";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="A simple internal dashboard showing which mock content patterns are working best, which personas are strongest, and where the studio should focus next."
      />
      <AnalyticsPanel snapshot={analyticsSnapshot} />
    </>
  );
}
