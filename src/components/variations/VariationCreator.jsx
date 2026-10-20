import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Split } from "lucide-react";
import { base44 } from "@/api/base44Client";

const LABELS = ["A", "B", "C", "D", "E", "F"];
const TEST_TYPES = ["layout", "headline", "cta", "funnel", "domain", "offer"];

export default function VariationCreator({ batchId, onCreated }) {
  const [count, setCount] = useState("3");
  const [baseUrl, setBaseUrl] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const create = async () => {
    if (!batchId) {
      setError("Pick a factory batch first");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const size = Number(count);
      const records = Array.from({ length: size }, (_, index) => ({
        batch_id: batchId,
        label: `Variation ${LABELS[index]}`,
        variant_type: TEST_TYPES[index % TEST_TYPES.length],
        url: baseUrl.trim() ? `${baseUrl.trim().replace(/\/$/, "")}/v${index + 1}` : "",
        ga_property_id: propertyId.trim(),
        status: propertyId.trim() ? "tracking" : "draft",
        notes: `Tests a different ${TEST_TYPES[index % TEST_TYPES.length]} than the control.`,
      }));
      await base44.entities.SiteVariation.bulkCreate(records);
      setBaseUrl("");
      onCreated();
    } catch (err) {
      setError(err.message || "Could not create variations");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-3 space-y-3">
        <div className="flex items-center gap-2">
          <Split className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium">Create a multi-site test set</p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">How many variations</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} variations</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Base URL (optional)</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://emergencyplumbernearme.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">GA4 property ID (optional)</Label>
            <Input value={propertyId} onChange={(e) => setPropertyId(e.target.value)} placeholder="123456789" />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={create} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Split className="w-4 h-4" />}
            Create variations
          </Button>
          <p className="text-xs text-muted-foreground">
            Each variation gets its own Google Analytics property and measurement ID so traffic can be attributed per site.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}