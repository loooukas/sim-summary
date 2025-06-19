"use client"
"use client"

import { subMonths, format } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface MonthlyBreakdownTableProps {
  monthlyTickets: Record<string, number>
  monthlyResolveTimes: Record<string, number[]>
}

export function MonthlyBreakdownTable({ monthlyTickets, monthlyResolveTimes }: MonthlyBreakdownTableProps) {
  // Use the last six *full* calendar months (latest month is the month prior to "now").
  const now = new Date()
  const lastFullMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const sortedMonths = Array.from({ length: 6 }).map((_, idx) =>
    format(subMonths(lastFullMonth, 5 - idx), "yyyy-MM")
  )

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
            {sortedMonths.map((month) => {
              const ticketCount = monthlyTickets[month] ?? 0
              const times = monthlyResolveTimes[month] ?? []
              const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null
              return (
                <TableRow key={month}>
                  <TableCell className="font-medium">
                    {new Date(month + "-01").toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">{ticketCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {avgTime !== null ? `${avgTime.toFixed(1)} hours` : "–"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
