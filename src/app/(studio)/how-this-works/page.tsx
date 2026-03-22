import { HowThisWorksPanel } from "@/components/sections/how-this-works-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function HowThisWorksPage() {
  return (
    <>
      <PageHeader
        title="How This Works"
        description="A simple guide to what this studio does, what the main terms mean, and how the workflow helps you save time while protecting your brand."
      />
      <HowThisWorksPanel />
    </>
  );
}
