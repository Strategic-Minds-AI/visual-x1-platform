import React from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MODULE_GROUPS } from "@/data/adminModules";

// Every Visual X module in one place: the console's dashboard buttons open this,
// and each entry is a working route, so the hub is the way the whole system's
// technology stays one click from the editor.
export default function ModuleHub({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[82vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading x1-track text-sm">VISUAL X MODULES</DialogTitle>
          <DialogDescription>
            The whole system, grouped by what it does. Every entry opens a live workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {MODULE_GROUPS.map((group) => (
            <section key={group.label}>
              <p className="x1-track text-[9px] text-muted-foreground mb-2">{group.label}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.items.map(({ to, label, desc, Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => onOpenChange(false)}
                    className="x1-glass-flat electric-hover flex items-start gap-3 rounded-xl p-3"
                  >
                    <span className="w-8 h-8 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">{label}</span>
                      <span className="block text-[11px] text-muted-foreground leading-snug">{desc}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}