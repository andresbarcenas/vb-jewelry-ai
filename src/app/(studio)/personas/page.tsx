import { PersonasPanel } from "@/components/sections/personas-panel";
import { PageHeader } from "@/components/ui/page-header";
import { personas } from "@/data/mock-studio";

export default function PersonasPage() {
  return (
    <>
      <PageHeader
        title="Personas"
        description="Approved campaign voices that help the team generate consistent Reel concepts without drifting away from the brand."
      />
      <PersonasPanel personas={personas} />
    </>
  );
}
