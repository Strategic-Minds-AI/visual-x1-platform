import React from "react";

// X1's section rhythm: a hairline rule and a wide-tracked eyebrow, then a large
// two-tone headline where the second clause carries X1's cyan.
export default function X1SectionHeading({ eyebrow, lead, accent, note }) {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="x1-rule w-10" />
        <span className="x1-track text-[10px] font-medium text-primary">{eyebrow}</span>
      </div>
      <h2 className="mt-4 font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
        {lead} <span className="text-primary">{accent}</span>
      </h2>
      {note ? <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl">{note}</p> : null}
    </div>
  );
}