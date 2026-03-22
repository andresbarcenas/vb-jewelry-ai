import { BrandProfilePanel } from "@/components/sections/brand-profile-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function BrandProfilePage() {
  return (
    <>
      <PageHeader
        title="Brand Profile"
        description="A simple business-owner form for the brand basics the studio should follow before generating content ideas or campaign direction."
      />
      <BrandProfilePanel />
    </>
  );
}
