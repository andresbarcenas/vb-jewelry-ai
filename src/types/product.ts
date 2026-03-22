export interface ProductLibraryItem {
  id: string;
  productName: string;
  category: string;
  material: string;
  color: string;
  styleTags: string[];
  productNotes: string;
  imageDataUrl: string | null;
  imageName: string;
}

export interface ProductAsset {
  id: string;
  name: string;
  sku: string;
  collection: string;
  category: string;
  material: string;
  status: "Ready" | "Needs Review" | "Draft";
  heroTone: "champagne" | "sand" | "sage" | "blush" | "obsidian";
  formats: string[];
  tags: string[];
  featured: boolean;
  launchWindow: string;
}
