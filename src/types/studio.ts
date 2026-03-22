export type StudioIconName =
  | "dashboard"
  | "guide"
  | "brand"
  | "personas"
  | "library"
  | "ideas"
  | "review"
  | "publishing"
  | "analytics"
  | "menu"
  | "spark";

export interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: StudioIconName;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  change: string;
  note: string;
}

export * from "@/types/brand";
export * from "@/types/persona";
export * from "@/types/product";
export * from "@/types/content";
export * from "@/types/video";
export * from "@/types/publishing";
