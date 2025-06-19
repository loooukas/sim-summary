"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface MonthlyBreakdownTableProps {
  monthlyTickets: Record<string, number>
  monthlyResolveTimes: Record<string, number[]>
}

export function MonthlyBreakdownTable({ monthlyTickets, monthlyResolveTimes }: MonthlyBreakdownTableProps) {
  // Only show last 6 months to match the chart
  const sortedMonths = Object.keys(monthlyTickets).sort().slice(-6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Breakdown Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Tickets</TableHead>
              <TableHead className="text-right">Avg Resolution Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMonths.length > 0 ? (
              sortedMonths.map((month) => {
                const avgTime = monthlyResolveTimes[month]
                  ? monthlyResolveTimes[month].reduce((a, b) => a + b, 0) / monthlyResolveTimes[month].length
                  : 0

                return (
                  <TableRow key={month}>
                    <TableCell className="font-medium">
                      {new Date(month + "-01").toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">{monthlyTickets[month].toLocaleString()}</TableCell>
                    <TableCell className="text-right">{avgTime.toFixed(1)} hours</TableCell>
                  </TableRow>
                )
              })
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
