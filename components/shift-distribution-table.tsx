"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Standard order we want the rows to appear in
const SHIFT_ORDER = ["Front Half Days", "Front Half Nights", "Back Half Days", "Back Half Nights", "Wednesday Days", "Wednesday Nights"] as const;

interface ShiftDistributionTableProps {
  shiftCounts: Record<string, number>
}

export function ShiftDistributionTable({ shiftCounts }: ShiftDistributionTableProps) {
  const total = Object.values(shiftCounts).reduce((a, b) => a + b, 0)
  // Keep rows in our defined order, filling missing shifts with 0
  const shiftEntries: [string, number][] = SHIFT_ORDER.map((shift) => [
    shift,
    shiftCounts[shift] ?? 0,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Distribution Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shift</TableHead>
              <TableHead className="text-right">Tickets</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shiftEntries.length > 0 ? (
              shiftEntries.map(([shift, count]) => (
                <TableRow key={shift}>
                  <TableCell className="font-medium">{shift}</TableCell>
                  <TableCell className="text-right">{count.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{((count / total) * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
