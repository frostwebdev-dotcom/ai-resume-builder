import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Full-bleed variant of `icon.svg` — iOS applies its own rounded mask. */
const APPLE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a7fe8"/><stop offset="1" stop-color="#1e3f9e"/></linearGradient></defs><rect width="64" height="64" fill="url(#t)"/><path d="M20 12h17l9 9v29a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2Z" fill="#fff"/><path d="M37 12v7a2 2 0 0 0 2 2h7Z" fill="#c9d8f8"/><circle cx="24.5" cy="22" r="3.2" fill="#2d5bd0"/><rect x="30" y="19" width="6" height="2.4" rx="1.2" fill="#2d5bd0"/><rect x="30" y="23" width="4" height="2" rx="1" fill="#a9bde9"/><rect x="22" y="30" width="20" height="2.4" rx="1.2" fill="#a9bde9"/><rect x="22" y="35.5" width="20" height="2.4" rx="1.2" fill="#a9bde9"/><rect x="22" y="41" width="11" height="2.4" rx="1.2" fill="#a9bde9"/><path d="M47 37q0 9 9 9-9 0-9 9 0-9-9-9 9 0 9-9Z" fill="#fbbf24" stroke="#1e3a8a" stroke-width="2" stroke-linejoin="round"/></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(APPLE_ICON_SVG).toString("base64")}`}
        width={180}
        height={180}
        alt=""
      />
    ),
    size,
  );
}
