import { PublishingQueuePanel } from "@/components/sections/publishing-queue-panel";
import { PageHeader } from "@/components/ui/page-header";
import { publishingQueueEntries } from "@/data/mock-studio";

export default function PublishingQueuePage() {
  return (
    <>
      <PageHeader
        title="Publishing Queue"
        description="Review approved content, finalize the posting details, and manually mark items ready to publish. This workflow stays local for now and is prepared for future scheduling integration."
      />
      <PublishingQueuePanel initialItems={publishingQueueEntries} />
    </>
  );
}
