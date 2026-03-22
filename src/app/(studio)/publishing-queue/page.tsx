import { PublishingQueuePanel } from "@/components/sections/publishing-queue-panel";
import { PageHeader } from "@/components/ui/page-header";
import { publishingQueue } from "@/data/mock-studio";

export default function PublishingQueuePage() {
  return (
    <>
      <PageHeader
        title="Publishing Queue"
        description="The final view of what is scheduled, what still needs a date, and which owner is holding each Reel."
      />
      <PublishingQueuePanel items={publishingQueue} />
    </>
  );
}
