"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { AnalysisResult } from "@/lib/data-analysis"

interface MonthlyBreakdownChartProps {
  analysisResult: AnalysisResult
}

const chartConfig = {
  tickets: {
    label: "Tickets",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function MonthlyBreakdownChart({ analysisResult }: MonthlyBreakdownChartProps) {
  // Show the previous 6 months: Dec 2024, Jan-May 2025
  const previous6Months = ["2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05"]

  const chartData = previous6Months.map((month) => ({
    month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    tickets: analysisResult.monthlyTickets[month] || 0,
  }))

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Upload data to see monthly trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  // Use the centralized calculations
  const sixMonthTotal = analysisResult.last6MonthsCount
  const sixMonthAverage = analysisResult.avgMonthly
  const trendPercentage = analysisResult.trendPercentage
  const projectedCurrentMonth = analysisResult.projectedCurrentMonth

  const isAboveTrend = trendPercentage > 0
  const TrendIcon = isAboveTrend ? TrendingUp : TrendingDown
  const trendColor = isAboveTrend ? "text-red-600" : "text-green-600"
  const trendText = isAboveTrend ? "above" : "below"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Breakdown</CardTitle>
        <CardDescription>Previous 6 months ticket volume</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12, top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} formatter={(value, name) => [value, "Tickets"]} />
            <Bar dataKey="tickets" fill="var(--color-tickets)" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="tickets" position="top" className="fill-foreground text-xs font-medium" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          6-month average: {sixMonthAverage.toFixed(1)} tickets per month
        </div>
        <div className="flex items-center gap-2 leading-none">
          <span className="text-muted-foreground">Current month projected:</span>
          <span className={`font-medium ${trendColor}`}>
            {projectedCurrentMonth.toFixed(0)} tickets ({Math.abs(trendPercentage).toFixed(1)}% {trendText} average)
          </span>
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        </div>
        <div className="leading-none text-muted-foreground">Total previous 6 months: {sixMonthTotal} tickets</div>
      </CardFooter>
    </Card>
  )
}
