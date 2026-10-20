import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Crown } from "lucide-react";
import TrackingSnippet from "@/components/variations/TrackingSnippet";

export default function VariationRow({ variation, onUpdate }) {
  const [propertyId, setPropertyId] = useState(variation.ga_property_id || "");
  const [measurementId, setMeasurementId] = useState(variation.ga_measurement_id || "");
  const [url, setUrl] = useState(variation.url || "");

  const save = (field, value) => {
    if (value === (variation[field] || "")) return;
    onUpdate(variation.id, { [field]: value });
  };

  return (
    <TableRow>
      <TableCell className="text-xs font-medium">
        <span className="flex items-center gap-1">
          {variation.is_leader && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
          {variation.label}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">{variation.variant_type}</Badge>
      </TableCell>
      <TableCell>
        <Input
          className="h-7 text-xs w-44"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => save("url", url)}
        />
      </TableCell>
      <TableCell>
        <Input
          className="h-7 text-xs w-32"
          placeholder="123456789"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          onBlur={() => save("ga_property_id", propertyId)}
        />
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Input
            className="h-7 text-xs w-32"
            placeholder="G-XXXXXXX"
            value={measurementId}
            onChange={(e) => setMeasurementId(e.target.value)}
            onBlur={() => save("ga_measurement_id", measurementId)}
          />
          <TrackingSnippet measurementId={measurementId} />
        </div>
      </TableCell>
      <TableCell className="text-xs">{variation.sessions || 0}</TableCell>
      <TableCell className="text-xs">{variation.users || 0}</TableCell>
      <TableCell className="text-xs">{variation.conversions || 0}</TableCell>
      <TableCell className="text-xs">{variation.conversion_rate || 0}%</TableCell>
      <TableCell className="text-xs font-bold">
        <span
          className={
            (variation.performance_score || 0) >= 60
              ? "text-green-600"
              : (variation.performance_score || 0) >= 30
                ? "text-yellow-600"
                : "text-muted-foreground"
          }
        >
          {variation.performance_score || 0}
        </span>
      </TableCell>
    </TableRow>
  );
}