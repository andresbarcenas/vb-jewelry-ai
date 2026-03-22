import { PersonasPanel } from "@/components/sections/personas-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function PersonasPage() {
  return (
    <>
      <PageHeader
        title="Personas"
        description="Use personas as a creative control center for styling direction, product fit, and future AI prompt consistency."
      />
      <PersonasPanel />
    </>
  );
}
