import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/frontend/config/site";

// Default link-preview card: brand mark and wordmark, no stock photo.

export const alt = "Rovera – car rental, booked in minutes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0a1730";
const ACCENT = "#6ee7b7";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `linear-gradient(135deg, ${NAVY} 0%, #12224a 100%)`,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="" width={96} height={96} style={{ borderRadius: 24 }} />
          <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: -4 }}>
            {siteConfig.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ width: 120, height: 8, background: ACCENT, borderRadius: 4 }} />
          <div style={{ fontSize: 52, fontWeight: 600, lineHeight: 1.15 }}>
            {siteConfig.seo.tagline}
          </div>
          <div style={{ fontSize: 30, color: "#b6c2e2" }}>
            Real-time availability. Transparent pricing. Instant confirmation.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 28, color: ACCENT }}>
          {new URL(siteConfig.url).host}
        </div>
      </div>
    ),
    size
  );
}
