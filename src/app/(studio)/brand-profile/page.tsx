import { BrandProfilePanel } from "@/components/sections/brand-profile-panel";
import { PageHeader } from "@/components/ui/page-header";
import { brandProfile } from "@/data/mock-studio";

export default function BrandProfilePage() {
  return (
    <>
      <PageHeader
        title="Brand Profile"
        description="A simple business-owner form for the brand basics the studio should follow before generating content ideas or campaign direction."
      />
      <BrandProfilePanel initialProfile={brandProfile} />
    </>
  );
}
