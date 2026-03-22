import { ContentIdeasPanel } from "@/components/sections/content-ideas-panel";
import { PageHeader } from "@/components/ui/page-header";
import { contentIdeas } from "@/data/mock-studio";

export default function ContentIdeasPage() {
  return (
    <>
      <PageHeader
        title="Content Ideas"
        description="A simple idea pipeline for reviewing hooks, themes, and product pairings before scripting or production begins."
      />
      <ContentIdeasPanel ideas={contentIdeas} />
    </>
  );
}
