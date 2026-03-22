import { ProductLibraryPanel } from "@/components/sections/product-library-panel";
import { PageHeader } from "@/components/ui/page-header";
import { productLibraryItems } from "@/data/mock-studio";

export default function ProductLibraryPage() {
  return (
    <>
      <PageHeader
        title="Product Library"
        description="Upload jewelry products, capture the key product details in plain language, and organize everything in one simple internal library."
      />
      <ProductLibraryPanel initialProducts={productLibraryItems} />
    </>
  );
}
