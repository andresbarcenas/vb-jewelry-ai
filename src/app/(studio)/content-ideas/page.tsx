import { ContentIdeasPanel } from "@/components/sections/content-ideas-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function ContentIdeasPage() {
  return (
    <>
      <PageHeader
        title="Content Ideas"
        description="Generate mock social content ideas by combining a persona, a product, and a creative direction. The workflow is structured so this step can later connect to an AI API."
      />
      <ContentIdeasPanel />
    </>
  );
}
