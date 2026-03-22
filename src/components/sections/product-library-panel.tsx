"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProductAsset } from "@/types/studio";

interface ProductLibraryPanelProps {
  products: ProductAsset[];
}

const toneStyles: Record<ProductAsset["heroTone"], string> = {
  champagne: "from-[#f4e7d1] to-[#e9d6b6]",
  sand: "from-[#eadfca] to-[#d6c0a0]",
  sage: "from-[#dae5db] to-[#b8c9b8]",
  blush: "from-[#f2dddd] to-[#dfc0c6]",
  obsidian: "from-[#7b756f] to-[#302d2a]",
};

export function ProductLibraryPanel({ products }: ProductLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const categories = Array.from(new Set(products.map((product) => product.category)));

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      search.length === 0 ||
      [
        product.name,
        product.collection,
        product.category,
        product.material,
        product.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCategory = category === "all" || product.category === category;
    const matchesStatus = status === "all" || product.status === status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products, collections, or tags"
        filters={[
          {
            label: "Category",
            value: category,
            onChange: setCategory,
            options: [
              { label: "All categories", value: "all" },
              ...categories.map((item) => ({ label: item, value: item })),
            ],
          },
          {
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { label: "All statuses", value: "all" },
              { label: "Ready", value: "Ready" },
              { label: "Needs Review", value: "Needs Review" },
              { label: "Draft", value: "Draft" },
            ],
          },
        ]}
        summary={`${filteredProducts.length} asset${filteredProducts.length === 1 ? "" : "s"} available`}
      />

      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No product assets match this view"
          description="Try a different category or status to see more placeholder assets."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <SectionCard
              key={product.id}
              title={product.name}
              description={`${product.collection} · ${product.category}`}
            >
              <div className="space-y-4">
                <div
                  className={`rounded-[24px] bg-gradient-to-br ${toneStyles[product.heroTone]} p-5`}
                >
                  <div className="rounded-[18px] border border-white/50 bg-white/35 px-4 py-10 text-center">
                    <p className="font-serif text-2xl font-semibold text-foreground">
                      {product.category}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {product.sku}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <StatusBadge value={product.status} />
                  {product.featured ? (
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                      Featured
                    </span>
                  ) : null}
                </div>

                <dl className="grid gap-3 text-sm text-muted-foreground">
                  <div>
                    <dt className="font-semibold text-foreground">Material</dt>
                    <dd className="mt-1">{product.material}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Launch window</dt>
                    <dd className="mt-1">{product.launchWindow}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Asset formats</dt>
                    <dd className="mt-1">{product.formats.join(", ")}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border/80 bg-white/80 px-3 py-1 text-xs font-semibold text-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
