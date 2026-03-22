import { ProductLibraryPanel } from "@/components/sections/product-library-panel";
import { PageHeader } from "@/components/ui/page-header";
import { productAssets } from "@/data/mock-studio";

export default function ProductLibraryPage() {
  return (
    <>
      <PageHeader
        title="Product Library"
        description="A working view of the current product assets the content team can safely pull into Instagram Reel concepts."
      />
      <ProductLibraryPanel products={productAssets} />
    </>
  );
}
