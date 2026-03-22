import { VideoReviewQueuePanel } from "@/components/sections/video-review-queue-panel";
import { PageHeader } from "@/components/ui/page-header";
import { videoReviewQueue } from "@/data/mock-studio";

export default function VideoReviewQueuePage() {
  return (
    <>
      <PageHeader
        title="Video Review Queue"
        description="Review-ready drafts, edit notes, and approval status in one place so nothing stalls before the publishing handoff."
      />
      <VideoReviewQueuePanel items={videoReviewQueue} />
    </>
  );
}
