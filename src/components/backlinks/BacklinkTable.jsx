import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

const STATUS_VARIANT = { deployed: "default", created: "secondary", pending: "outline", failed: "destructive" };

const HEALTH_STYLE = {
  healthy: "text-green-600",
  degraded: "text-yellow-600",
  not_live: "text-orange-600",
  down: "text-red-600",
  unknown: "text-muted-foreground",
};

const HEALTH_LABEL = { healthy: "Live", degraded: "Degraded", not_live: "Not live", down: "Down", unknown: "Unchecked" };

export default function BacklinkTable({ rows, loading, hasMore, onLoadMore, selectedIds, onToggle, onUpdate }) {
  if (loading && rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading sites...</p>;
  }
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No backlink sites match this filter.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="text-xs">Keyword</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Site</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Health</TableHead>
              <TableHead className="text-xs">DA</TableHead>
              <TableHead className="text-xs">Last check</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const health = row.health_status || "unknown";
              return (
                <TableRow key={row.id}>
                  <TableCell className="py-2">
                    <Checkbox checked={selectedIds.includes(row.id)} onCheckedChange={() => onToggle(row.id)} />
                  </TableCell>
                  <TableCell className="text-xs font-medium">{row.target_keyword}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.target_location || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.site_type}</TableCell>
                  <TableCell className="text-xs">
                    {row.site_url ? (
                      <a
                        href={row.site_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="max-w-[200px] truncate">{row.site_url.replace(/^https?:\/\//, "")}</span>
                      </a>
                    ) : (
                      <Input
                        className="h-7 text-xs w-44"
                        placeholder="Paste site URL"
                        onBlur={(e) => e.target.value.trim() && onUpdate(row.id, e.target.value.trim())}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[row.status] || "outline"} className="text-xs">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-xs font-medium ${HEALTH_STYLE[health]}`} title={row.health_note || ""}>
                    {HEALTH_LABEL[health]}
                  </TableCell>
                  <TableCell className="text-xs">{row.domain_authority || 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.last_checked_at ? new Date(row.last_checked_at).toLocaleDateString() : "Never"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loading}>
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}