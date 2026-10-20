import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import VariationRow from "@/components/variations/VariationRow";

export default function VariationTable({ variations, loading, onUpdate }) {
  if (loading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading variations...</p>;
  }
  if (variations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No variations yet. Create a test set above to start comparing sites.
      </p>
    );
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Variation</TableHead>
            <TableHead className="text-xs">Tests</TableHead>
            <TableHead className="text-xs">Live URL</TableHead>
            <TableHead className="text-xs">GA property ID</TableHead>
            <TableHead className="text-xs">Measurement ID</TableHead>
            <TableHead className="text-xs">Sessions</TableHead>
            <TableHead className="text-xs">Users</TableHead>
            <TableHead className="text-xs">Conversions</TableHead>
            <TableHead className="text-xs">Conv. rate</TableHead>
            <TableHead className="text-xs">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variations.map((variation) => (
            <VariationRow key={variation.id} variation={variation} onUpdate={onUpdate} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}