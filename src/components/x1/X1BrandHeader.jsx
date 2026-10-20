import React from "react";
import { ExternalLink } from "lucide-react";
import { X1_BRAND } from "@/data/x1Surfaces";

export default function X1BrandHeader() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      <div
        className="absolute inset-0 opacity-40"
        style={{ backgroundImage: `url(${X1_BRAND.earth})`, backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 70% 28%, rgba(18,140,255,.22), transparent 55%), linear-gradient(180deg, rgba(2,5,13,.55), rgba(2,5,13,.94))"
        }}
        aria-hidden="true"
      />
      <div className="relative px-5 py-5 flex flex-wrap items-center gap-4">
        <img src={X1_BRAND.emblem} alt="" className="h-14 w-14 object-contain" />
        <div className="min-w-0">
          <img src={X1_BRAND.wordmark} alt={X1_BRAND.name} className="h-6 object-contain" />
          <p className="text-[10px] tracking-[0.34em] text-muted-foreground mt-1">X1 OPERATING SYSTEM</p>
          <p className="text-[10px] tracking-[0.3em] text-primary mt-0.5">{X1_BRAND.tagline}</p>
        </div>
        <a
          href={X1_BRAND.site}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-xs inline-flex items-center gap-1 underline underline-offset-4"
        >
          X1 live <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="relative px-5 py-3 border-t border-border bg-card/60">
        <p className="text-[10px] tracking-[0.24em] text-muted-foreground mb-2">
          X1 BRAND TOKENS, TAKEN FROM BrandTheme.css
        </p>
        <div className="flex flex-wrap gap-1.5">
          {X1_BRAND.swatches.map((s) => (
            <span
              key={s.token}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[10px]"
              title={`${s.token} ${s.hex}`}
            >
              <span className="w-3 h-3 rounded-sm border border-border" style={{ background: s.hex }} aria-hidden="true" />
              <span className="text-muted-foreground">{s.token}</span>
              <span className="font-mono">{s.hex}</span>
            </span>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Typeface {X1_BRAND.font}. Dark is the X1 identity exactly; the light theme is the same palette made legible on white, so the theme toggle keeps working.
        </p>
      </div>
    </div>
  );
}