"use client";

import type { StudioIconName } from "@/types/studio";

interface StudioIconProps {
  name: StudioIconName;
  className?: string;
}

export function StudioIcon({ name, className }: StudioIconProps) {
  const sharedProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {name === "dashboard" && (
        <>
          <rect {...sharedProps} x="3" y="3" width="8" height="8" rx="2" />
          <rect {...sharedProps} x="13" y="3" width="8" height="5" rx="2" />
          <rect {...sharedProps} x="13" y="10" width="8" height="11" rx="2" />
          <rect {...sharedProps} x="3" y="13" width="8" height="8" rx="2" />
        </>
      )}
      {name === "brand" && (
        <>
          <path {...sharedProps} d="M12 4c3.5 0 6 2.4 6 5.4 0 4.1-6 10.6-6 10.6S6 13.5 6 9.4C6 6.4 8.5 4 12 4Z" />
          <path {...sharedProps} d="M9.8 10.5c.6 1 1.5 1.5 2.2 1.5 1.3 0 2.2-1.1 2.2-2.4S13.4 7 12 7c-.9 0-1.7.4-2.2 1.2" />
        </>
      )}
      {name === "personas" && (
        <>
          <path {...sharedProps} d="M8.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path {...sharedProps} d="M15.5 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path {...sharedProps} d="M3.5 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
          <path {...sharedProps} d="M13 19c.2-1.9 1.9-3.5 4-3.5 2.2 0 4 1.6 4 3.5" />
        </>
      )}
      {name === "library" && (
        <>
          <path {...sharedProps} d="M5 5.5h8a2 2 0 0 1 2 2v11H7a2 2 0 0 0-2 2Z" />
          <path {...sharedProps} d="M19 5.5h-8a2 2 0 0 0-2 2v11h8a2 2 0 0 1 2 2Z" />
        </>
      )}
      {name === "ideas" && (
        <>
          <path {...sharedProps} d="M12 4a5 5 0 0 0-3.4 8.7c.8.7 1.4 1.5 1.6 2.5h3.6c.2-1 .8-1.8 1.6-2.5A5 5 0 0 0 12 4Z" />
          <path {...sharedProps} d="M10 18h4" />
          <path {...sharedProps} d="M10.5 21h3" />
        </>
      )}
      {name === "review" && (
        <>
          <path {...sharedProps} d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17h-6l-4.5 3v-3H6.5A2.5 2.5 0 0 1 4 14.5Z" />
          <path {...sharedProps} d="m9.5 10.5 2 2 4-4" />
        </>
      )}
      {name === "publishing" && (
        <>
          <rect {...sharedProps} x="4" y="5" width="16" height="15" rx="2" />
          <path {...sharedProps} d="M8 3v4" />
          <path {...sharedProps} d="M16 3v4" />
          <path {...sharedProps} d="M4 10h16" />
          <path {...sharedProps} d="m9 14 2 2 4-4" />
        </>
      )}
      {name === "analytics" && (
        <>
          <path {...sharedProps} d="M4 19V6" />
          <path {...sharedProps} d="M10 19V10" />
          <path {...sharedProps} d="M16 19V13" />
          <path {...sharedProps} d="M22 19V4" />
        </>
      )}
      {name === "menu" && (
        <>
          <path {...sharedProps} d="M4 7h16" />
          <path {...sharedProps} d="M4 12h16" />
          <path {...sharedProps} d="M4 17h16" />
        </>
      )}
      {name === "spark" && (
        <>
          <path {...sharedProps} d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" />
          <path {...sharedProps} d="m18.5 15 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
          <path {...sharedProps} d="m5.5 14 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" />
        </>
      )}
    </svg>
  );
}
