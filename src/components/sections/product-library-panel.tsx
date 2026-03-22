"use client";

import Image from "next/image";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { SectionCard } from "@/components/ui/section-card";
import { useStudioProducts } from "@/lib/studio-data-provider";
import type { ProductLibraryItem } from "@/types/studio";

interface ProductDraft {
  productName: string;
  category: string;
  material: string;
  color: string;
  styleTags: string;
  productNotes: string;
  imageDataUrl: string | null;
  imageName: string;
}

interface FieldShellProps {
  label: string;
  helperText: string;
  children: React.ReactNode;
}

const inputClasses =
  "mt-2 w-full rounded-2xl border border-border/80 bg-white/85 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

const photoThemes = [
  "from-[#ead9c1] via-[#faf2e7] to-[#d5c2a6]",
  "from-[#dbe6df] via-[#f6faf8] to-[#bdccb9]",
  "from-[#e7d7dc] via-[#f9f1f3] to-[#d7c0c7]",
  "from-[#eadfcf] via-[#faf7f1] to-[#d6c1a5]",
];

function createEmptyDraft(): ProductDraft {
  return {
    productName: "",
    category: "",
    material: "",
    color: "",
    styleTags: "",
    productNotes: "",
    imageDataUrl: null,
    imageName: "",
  };
}

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildDraftFromProduct(product: ProductLibraryItem): ProductDraft {
  return {
    productName: product.productName,
    category: product.category,
    material: product.material,
    color: product.color,
    styleTags: product.styleTags.join(", "),
    productNotes: product.productNotes,
    imageDataUrl: product.imageDataUrl,
    imageName: product.imageName,
  };
}

function buildProductFromDraft(draft: ProductDraft, id: string): ProductLibraryItem {
  return {
    id,
    productName: draft.productName.trim(),
    category: draft.category.trim(),
    material: draft.material.trim(),
    color: draft.color.trim(),
    styleTags: splitCommaList(draft.styleTags),
    productNotes: draft.productNotes.trim(),
    imageDataUrl: draft.imageDataUrl,
    imageName: draft.imageName.trim(),
  };
}

function createProductId() {
  return `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function FieldShell({ label, helperText, children }: FieldShellProps) {
  return (
    <div className="block">
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
        {helperText}
      </span>
      {children}
    </div>
  );
}

function ProductImagePlaceholder({
  productName,
  imageDataUrl,
  index,
}: {
  productName: string;
  imageDataUrl: string | null;
  index: number;
}) {
  if (imageDataUrl) {
    return (
      <div className="overflow-hidden rounded-[24px] border border-border/80 bg-white/60">
        {/* The uploaded image is stored as mock local data for now so users can test the workflow. */}
        <Image
          alt={productName}
          className="h-52 w-full object-cover"
          height={416}
          src={imageDataUrl}
          unoptimized
          width={416}
        />
      </div>
    );
  }

  return (
    <div className={`rounded-[24px] bg-gradient-to-br ${photoThemes[index % photoThemes.length]} p-4`}>
      <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-[20px] border border-white/50 bg-white/25">
        <div className="absolute inset-x-10 bottom-0 h-28 rounded-t-[999px] bg-white/24" />
        <div className="relative rounded-[22px] border border-white/65 bg-white/55 px-6 py-5 text-center">
          <p className="font-serif text-2xl font-semibold text-foreground">
            {productName || "Product"}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Image placeholder
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProductLibraryPanel() {
  const { createProduct, deleteProduct, products, resetProducts, updateProduct } =
    useStudioProducts();
  const [draft, setDraft] = useState<ProductDraft>(createEmptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  const categories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
  const tags = Array.from(
    new Set(products.flatMap((product) => product.styleTags).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      search.length === 0 ||
      [
        product.productName,
        product.category,
        product.material,
        product.color,
        product.styleTags.join(" "),
        product.productNotes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesTag =
      tagFilter === "all" || product.styleTags.includes(tagFilter);

    return matchesSearch && matchesCategory && matchesTag;
  });

  const formIsValid =
    draft.productName.trim().length > 0 &&
    draft.category.trim().length > 0 &&
    draft.material.trim().length > 0 &&
    draft.color.trim().length > 0 &&
    splitCommaList(draft.styleTags).length > 0 &&
    draft.productNotes.trim().length > 0;

  function updateDraft(field: keyof ProductDraft, value: string | null) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setDraft(createEmptyDraft());
    setEditingId(null);
  }

  async function handleImageChange(file: File | undefined) {
    if (!file) {
      updateDraft("imageDataUrl", null);
      updateDraft("imageName", "");
      return;
    }

    const fileDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    setDraft((current) => ({
      ...current,
      imageDataUrl: fileDataUrl,
      imageName: file.name,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formIsValid) {
      return;
    }

    if (editingId) {
      await updateProduct(buildProductFromDraft(draft, editingId));
      resetForm();
      return;
    }

    await createProduct(buildProductFromDraft(draft, createProductId()));
    resetForm();
  }

  function handleEdit(product: ProductLibraryItem) {
    setEditingId(product.id);
    setDraft(buildDraftFromProduct(product));
  }

  async function handleRemove(productId: string) {
    await deleteProduct(productId);

    if (editingId === productId) {
      resetForm();
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-border/80 bg-accent-soft/45 px-5 py-4">
        <p className="text-sm font-semibold text-foreground">How to add products</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Add one product at a time using simple business language. Upload a jewelry image if you have one, fill in the product details, and the item will appear below in the product grid.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title={editingId ? "Edit product" : "Add product"}
          description="This form is designed for non-technical users, so each field explains exactly what information belongs there."
        >
          <form
            className="space-y-5"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FieldShell
                label="Product image"
                helperText="Upload a clear product photo if you have one. If not, the item will still be saved with a placeholder image."
              >
                <input
                  accept="image/*"
                  className="sr-only"
                  id="product-image-input"
                  onChange={(event) => void handleImageChange(event.target.files?.[0])}
                  type="file"
                />
                <label
                  className="mt-2 block cursor-pointer rounded-[24px] border border-dashed border-border bg-white/75 p-4 transition hover:border-accent/50 hover:bg-white"
                  htmlFor="product-image-input"
                >
                  <div className="space-y-3">
                    <ProductImagePlaceholder
                      imageDataUrl={draft.imageDataUrl}
                      index={0}
                      productName={draft.productName}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {draft.imageName || "Choose image"}
                      </p>
                      <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                        Upload photo
                      </span>
                    </div>
                  </div>
                </label>
              </FieldShell>

              <div className="space-y-5">
                <FieldShell
                  label="Product name"
                  helperText="Use the product name your team would recognize right away."
                >
                  <input
                    className={inputClasses}
                    type="text"
                    value={draft.productName}
                    onChange={(event) => updateDraft("productName", event.target.value)}
                  />
                </FieldShell>

                <FieldShell
                  label="Category"
                  helperText="Choose the main product group, such as earrings, necklace, ring, or bracelet."
                >
                  <input
                    className={inputClasses}
                    type="text"
                    value={draft.category}
                    onChange={(event) => updateDraft("category", event.target.value)}
                  />
                </FieldShell>
              </div>

              <FieldShell
                label="Material"
                helperText="Describe what the item is made from in plain language, like gold-filled, sterling silver, or pearl."
              >
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={draft.material}
                  onChange={(event) => updateDraft("material", event.target.value)}
                />
              </FieldShell>

              <FieldShell
                label="Color"
                helperText="Write the main color or finish someone would notice first, such as warm gold, silver, blush pearl, or ivory."
              >
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={draft.color}
                  onChange={(event) => updateDraft("color", event.target.value)}
                />
              </FieldShell>

              <FieldShell
                label="Style tags"
                helperText="Add short descriptive tags separated by commas, like minimal, layered, statement, handmade, or occasion."
              >
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={draft.styleTags}
                  onChange={(event) => updateDraft("styleTags", event.target.value)}
                />
              </FieldShell>

              <FieldShell
                label="Product notes"
                helperText="Add anything helpful for the content team, such as how to style it, what kind of Reel it fits, or what detail to highlight."
              >
                <textarea
                  className={inputClasses}
                  rows={4}
                  value={draft.productNotes}
                  onChange={(event) => updateDraft("productNotes", event.target.value)}
                />
              </FieldShell>
            </div>

            <div className="flex flex-col gap-3 rounded-[24px] border border-border/80 bg-white/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {products.length} product{products.length === 1 ? "" : "s"} saved
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Product data is stored in a mocked browser-local store for now, so you can test adding and managing items without a backend.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {editingId ? (
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                    onClick={resetForm}
                    type="button"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!formIsValid}
                  type="submit"
                >
                  {editingId ? "Update product" : "Add product"}
                </button>
              </div>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Library tools"
          description="Use these controls to filter what you see or reset the demo data if you want to start over."
          className="h-fit"
        >
          <div className="space-y-4">
            <div className="rounded-[24px] border border-border/80 bg-accent-soft/35 px-4 py-4">
              <p className="text-sm font-semibold text-foreground">Filtering tip</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Filter by category when you want one product group, or by style tag when you want a specific content angle like minimal, statement, or layering.
              </p>
            </div>

            <button
              className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/85 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
              onClick={() => {
                void resetProducts();
                resetForm();
              }}
              type="button"
            >
              Reset to sample products
            </button>
          </div>
        </SectionCard>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products, materials, colors, or notes"
        filters={[
          {
            label: "Category",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: "All categories", value: "all" },
              ...categories.map((item) => ({ label: item, value: item })),
            ],
          },
          {
            label: "Style tag",
            value: tagFilter,
            onChange: setTagFilter,
            options: [
              { label: "All tags", value: "all" },
              ...tags.map((item) => ({ label: item, value: item })),
            ],
          },
        ]}
        summary={`${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} shown`}
      />

      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No products match these filters"
          description="Try clearing the category or tag filter, or add a new product above."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product, index) => (
            <SectionCard
              key={product.id}
              title={product.productName}
              description={`${product.category} · ${product.color}`}
            >
              <div className="space-y-4">
                <ProductImagePlaceholder
                  imageDataUrl={product.imageDataUrl}
                  index={index}
                  productName={product.productName}
                />

                <dl className="grid gap-3 text-sm text-muted-foreground">
                  <div>
                    <dt className="font-semibold text-foreground">Category</dt>
                    <dd className="mt-1">{product.category}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Material</dt>
                    <dd className="mt-1">{product.material}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Color</dt>
                    <dd className="mt-1">{product.color}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Product notes</dt>
                    <dd className="mt-1 leading-6">{product.productNotes}</dd>
                  </div>
                </dl>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Style tags
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.styleTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border/80 bg-white/80 px-3 py-1 text-xs font-semibold text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                    onClick={() => handleEdit(product)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-danger/20 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/15"
                    onClick={() => {
                      void handleRemove(product.id);
                    }}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
