import React from "react";
import { Badge } from "@/components/ui/badge";

// A consistent shell for every part of the client-facing package.
export default function DiscoverySection({ title, description, badge, children, className }) {
  return (
    <section className={`rounded-xl border border-border bg-card ${className || ""}`}>
      <div className="px-5 py-3.5 border-b border-border flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-heading text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {badge && <Badge variant="secondary" className="text-[11px]">{badge}</Badge>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}