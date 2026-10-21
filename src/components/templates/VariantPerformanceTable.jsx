import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// What Search Console actually reported for each launched page. A zero means the page has
// no impressions in the window, not that it ranks.
export default function VariantPerformanceTable({ variants, loading }) {
  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-6">Reading launched pages...</p>;
  }
  if (!variants.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No launched page yet. Launch a wave, then sync Search Console once the pages are live.
      </p>
    );
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Keyword</TableHead>
            <TableHead className="text-xs">Location</TableHead>
            <TableHead className="text-xs">Page</TableHead>
            <TableHead className="text-xs text-right">Impressions</TableHead>
            <TableHead className="text-xs text-right">Clicks</TableHead>
            <TableHead className="text-xs text-right">CTR</TableHead>
            <TableHead className="text-xs text-right">Position</TableHead>
            <TableHead className="text-xs">Top query</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="text-xs font-medium">{v.target_keyword}</TableCell>
              <TableCell className="text-xs">{v.target_location || "National"}</TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground max-w-[240px] truncate">
                {v.url || "—"}
              </TableCell>
              <TableCell className="text-xs text-right">{v.impressions || 0}</TableCell>
              <TableCell className="text-xs text-right">{v.clicks || 0}</TableCell>
              <TableCell className="text-xs text-right">{v.ctr ? `${v.ctr}%` : "—"}</TableCell>
              <TableCell className="text-xs text-right">{v.avg_position ? v.avg_position.toFixed(1) : "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{v.top_query || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}