import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// A labelled field with the reason it is being asked for, so no question feels like a form tax.
export default function IntakeField({ label, hint, required, error, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {hint && <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>}
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

export const TextField = ({ label, hint, required, error, value, onChange, placeholder, type = "text", className }) => (
  <IntakeField label={label} hint={hint} required={required} error={error} className={className}>
    <Input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </IntakeField>
);

export const AreaField = ({ label, hint, required, error, value, onChange, placeholder, rows = 4, className }) => (
  <IntakeField label={label} hint={hint} required={required} error={error} className={className}>
    <Textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
  </IntakeField>
);