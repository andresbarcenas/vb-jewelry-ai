import type { NavItem } from "@/types/studio";

// Keep sidebar labels and routes in one place so navigation updates stay simple.
export const studioNavigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "Overall studio health and immediate priorities.",
    icon: "dashboard",
  },
  {
    label: "How This Works",
    href: "/how-this-works",
    description: "A simple guide for understanding the studio and workflow.",
    icon: "guide",
  },
  {
    label: "Brand Profile",
    href: "/brand-profile",
    description: "The voice, guardrails, and creative rules the team should follow.",
    icon: "brand",
  },
  {
    label: "Personas",
    href: "/personas",
    description: "Approved on-camera or voiceover personas for Reel concepts.",
    icon: "personas",
  },
  {
    label: "Product Library",
    href: "/product-library",
    description: "Ready-to-use product assets and supporting metadata.",
    icon: "library",
  },
  {
    label: "Content Ideas",
    href: "/content-ideas",
    description: "Campaign concepts waiting to be scripted or refined.",
    icon: "ideas",
  },
  {
    label: "Video Review Queue",
    href: "/video-review-queue",
    description: "Draft videos awaiting feedback or approval.",
    icon: "review",
  },
  {
    label: "Publishing Queue",
    href: "/publishing-queue",
    description: "Scheduled and upcoming Instagram Reel deliveries.",
    icon: "publishing",
  },
  {
    label: "Analytics",
    href: "/analytics",
    description: "Performance readout for personas, themes, and campaign trends.",
    icon: "analytics",
  },
];
