import { cn } from "@/lib/utils";

/**
 * Smart Resume Builder mark — a résumé page with an AI sparkle.
 * Drawn to sit inside the `.brand-mark` gradient tile (the tile supplies the background).
 * Keep in sync with `src/app/icon.svg`, `src/app/apple-icon.tsx`, and `public/logo*.svg`.
 */
export function BrandGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      className={cn("relative z-10 size-full", className)}
    >
      <path
        d="M20 12h17l9 9v29a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2Z"
        fill="#fff"
      />
      <path d="M37 12v7a2 2 0 0 0 2 2h7Z" fill="#c9d8f8" />
      <circle cx="24.5" cy="22" r="3.2" fill="#2d5bd0" />
      <rect x="30" y="19" width="6" height="2.4" rx="1.2" fill="#2d5bd0" />
      <rect x="30" y="23" width="4" height="2" rx="1" fill="#a9bde9" />
      <rect x="22" y="30" width="20" height="2.4" rx="1.2" fill="#a9bde9" />
      <rect x="22" y="35.5" width="20" height="2.4" rx="1.2" fill="#a9bde9" />
      <rect x="22" y="41" width="11" height="2.4" rx="1.2" fill="#a9bde9" />
      <path
        d="M47 37q0 9 9 9-9 0-9 9 0-9-9-9 9 0 9-9Z"
        fill="#fbbf24"
        stroke="#1e3a8a"
        strokeWidth="2"
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    </svg>
  );
}
