"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import type { AnalysisResult } from "@/lib/data-analysis"

interface ShiftDistributionChartProps {
  analysisResult: AnalysisResult
}

const chartConfig = {
  tickets: {
    label: "Tickets",
  },
  "Front Half Days": {
    label: "Front Half Days",
    color: "hsl(var(--chart-1))",
  },
  "Front Half Nights": {
    label: "Front Half Nights",
    color: "hsl(var(--chart-2))",
  },
  "Back Half Days": {
    label: "Back Half Days",
    color: "hsl(var(--chart-3))",
  },
  "Back Half Nights": {
    label: "Back Half Nights",
    color: "hsl(var(--chart-4))",
  },
  "Wednesday Days": {
    label: "Wednesday Days",
    color: "hsl(var(--chart-5))",
  },
  "Wednesday Nights": {
    label: "Wednesday Nights",
    color: "hsl(220 70% 50%)",
  },
} satisfies ChartConfig

const colorMap: Record<string, string> = {
  "Front Half Days": "hsl(var(--chart-1))",
  "Front Half Nights": "hsl(var(--chart-2))",
  "Back Half Days": "hsl(var(--chart-3))",
  "Back Half Nights": "hsl(var(--chart-4))",
  "Wednesday Days": "hsl(var(--chart-5))",
  "Wednesday Nights": "hsl(220 70% 50%)",
}

export function ShiftDistributionChart({ analysisResult }: ShiftDistributionChartProps) {
  const [selectedPeriod, setSelectedPeriod] = React.useState<"1mo" | "3mo" | "6mo" | "all">("6mo")

  // Get the appropriate shift counts based on selected period
  const getShiftCounts = () => {
    switch (selectedPeriod) {
      case "1mo":
        return analysisResult.last1MonthShiftCounts
      case "3mo":
        return analysisResult.last3MonthsShiftCounts
      case "6mo":
        return analysisResult.last6MonthsShiftCounts
      case "all":
        return analysisResult.shiftCounts
      default:
        return analysisResult.last6MonthsShiftCounts
    }
  }

  const shiftCounts = getShiftCounts()

  const chartData = Object.entries(shiftCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([shift, count]) => ({
      shift,
      tickets: count,
      fill: colorMap[shift] || "hsl(var(--chart-1))",
      percentage: 0,
    }))

  const totalTickets = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.tickets, 0)
  }, [chartData])

  // Calculate percentages
  chartData.forEach((item) => {
    item.percentage = totalTickets > 0 ? (item.tickets / totalTickets) * 100 : 0
  })

  if (totalTickets === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Shift Distribution</CardTitle>
          <CardDescription>Upload data to see shift distribution</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "1mo":
        return "Previous full month"
      case "3mo":
        return "Previous 3 months"
      case "6mo":
        return "Previous 6 months"
      case "all":
        return "All time"
      default:
        return "Previous 6 months"
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <div className="flex items-center justify-between w-full mb-2">
          <CardTitle>Shift Distribution</CardTitle>
          <div className="flex gap-1">
            {(["1mo", "3mo", "6mo", "all"] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="text-xs px-2 py-1"
              >
                {period === "all" ? "All" : period}
              </Button>
            ))}
          </div>
        </div>
        <CardDescription>Ticket distribution across shifts - {getPeriodLabel()}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.fill }} />
                          <span className="font-medium">{data.shift}</span>
                        </div>
                        <div className="grid gap-1 text-sm">
                          <div>Tickets: {data.tickets.toLocaleString()}</div>
                          <div>Percentage: {data.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  )
                }
              }}
            />
            <Pie data={chartData} dataKey="tickets" nameKey="shift" innerRadius={80} outerRadius={140} strokeWidth={2}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {totalTickets.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          Total Tickets
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent />} className="flex-wrap gap-2 text-sm mt-4" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
