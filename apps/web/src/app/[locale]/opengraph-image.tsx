import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { brandName, defaultLocale, getMessages, isLocale } from "@bba/i18n";
import { colors } from "@bba/ui/tokens";

export const alt = brandName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share image: the wordmark and tagline on ivory. Satori reads no CSS variables, so token values are inlined. */
export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { meta } = getMessages(isLocale(locale) ? locale : defaultLocale);
  const artwork = await readFile(join(process.cwd(), "public/brand/wordmark.png"));
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: colors.ivory[100], color: colors.navy[900], borderBottom: `14px solid ${colors.navy[900]}` }}>
      {/* ImageResponse needs an inline image rather than next/image. */}
      <img src={`data:image/png;base64,${artwork.toString("base64")}`} alt="" width={1000} height={333} />
      <div style={{ fontSize: 29, marginTop: 10, letterSpacing: "0.02em" }}>{meta.tagline}</div>
    </div>,
    size,
  );
}
