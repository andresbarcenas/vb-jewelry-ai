import { PersonasPanel } from "@/components/sections/personas-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function PersonasPage() {
  return (
    <>
      <PageHeader
        title="Personas"
        description="Create and manage up to five fictional model profiles so the team can present jewelry through consistent, reusable style perspectives."
      />
      <PersonasPanel />
    </>
  );
}
