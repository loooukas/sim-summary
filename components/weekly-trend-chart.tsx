"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { AnalysisResult } from "@/lib/data-analysis"

interface WeeklyTrendChartProps {
  analysisResult: AnalysisResult
}

const chartConfig = {
  tickets: {
    label: "Tickets",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function WeeklyTrendChart({ analysisResult }: WeeklyTrendChartProps) {
  // Get last 12 weeks of data
  const sortedWeeks = Object.keys(analysisResult.weeklyTickets).sort().slice(-12)

  const chartData = sortedWeeks.map((week) => {
    const avgResolutionTime = analysisResult.weeklyResolveTimes[week]
      ? analysisResult.weeklyResolveTimes[week].reduce((a, b) => a + b, 0) /
        analysisResult.weeklyResolveTimes[week].length
      : 0

    return {
      week: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tickets: analysisResult.weeklyTickets[week] || 0,
      avgResolutionTime: Number(avgResolutionTime.toFixed(1)),
    }
  })

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Trend</CardTitle>
          <CardDescription>Upload data to see weekly trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  const avgTickets = chartData.reduce((sum, item) => sum + item.tickets, 0) / chartData.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Trend</CardTitle>
        <CardDescription>Last 12 weeks ticket volume</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line dataKey="tickets" type="monotone" stroke="var(--color-tickets)" strokeWidth={2} dot={true} />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Average {avgTickets.toFixed(0)} tickets per week <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Showing weekly ticket volume trends
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
