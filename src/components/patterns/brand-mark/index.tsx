// Source: ThesIsko brand guide v1.0 (Logo, Logo Clearance and Minimum Size) and the hybrid logo strategy
// (UX-D-10, UX-D-11 item 6). Full logo on LOGIN; symbol or text treatment in the role shells; symbol in
// compact navigation. Only the supplied artwork files are shown, at their own proportions: never redrawn,
// recolored or stretched. Below 140 px of width, use the symbol (brand guide).
// The text treatment is the plain product name in one weight. It is not a retyped copy of the logo
// wordmark ("Thes" Medium, "Isko" Bold), which only the artwork may show.
/* eslint-disable @next/next/no-img-element -- official SVG artwork at its intrinsic size, no optimization */
import { cn } from "@/lib/utils";

export type BrandArtwork = { src: string; width: number; height: number };

export type BrandMarkProps = {
  variant: "full" | "symbol" | "text";
  /** The official artwork file for `full` or `symbol` (from public/brand/). Without it, the text treatment shows. */
  artwork?: BrandArtwork;
  /** Text treatment only: show "Graduate Thesis Progress" under the name. */
  descriptor?: boolean;
  className?: string;
};

export const BRAND_NAME = "ThesIsko";
export const BRAND_DESCRIPTOR = "Graduate Thesis Progress";

export function BrandMark({ variant, artwork, descriptor = false, className }: BrandMarkProps) {
  if (variant !== "text" && artwork) {
    return <img src={artwork.src} width={artwork.width} height={artwork.height} alt={BRAND_NAME} className={cn("shrink-0", className)} />;
  }
  // A shortened or cropped mark would be an unofficial variant, so a symbol slot with no artwork shows nothing.
  if (variant === "symbol") return <span className="sr-only">{BRAND_NAME}</span>;
  return (
    <span data-slot="brand-mark" data-variant="text" className={cn("inline-flex flex-col leading-none", className)}>
      <span className="font-serif text-base font-semibold text-wordmark">{BRAND_NAME}</span>
      {descriptor ? (
        <span className="mt-1 text-[0.8rem] leading-4 font-medium tracking-wide text-muted-foreground">{BRAND_DESCRIPTOR}</span>
      ) : null}
    </span>
  );
}
