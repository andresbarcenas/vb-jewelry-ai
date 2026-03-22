import { BrandProfilePanel } from "@/components/sections/brand-profile-panel";
import { PageHeader } from "@/components/ui/page-header";
import { brandProfile } from "@/data/mock-studio";

export default function BrandProfilePage() {
  return (
    <>
      <PageHeader
        title="Brand Profile"
        description="The voice, guardrails, and creative direction that keep AI-assisted content aligned with VB Jewelry before anything goes into production."
      />
      <BrandProfilePanel initialProfile={brandProfile} />
    </>
  );
}
