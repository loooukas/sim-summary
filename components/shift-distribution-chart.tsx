

"use client"

import * as React from "react"
import {
  PieChart,
  Pie,
  Label,
} from "recharts"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import type { AnalysisResult } from "@/lib/data-analysis"

/* ------------------------------------------------------------------ */
/*  Shared constants – import from here in the table component later  */
/* ------------------------------------------------------------------ */

export const SHIFT_LABELS = {
  "Front Half Days": "Front Half Days",
  "Front Half Nights": "Front Half Nights",
  "Back Half Days": "Back Half Days",
  "Back Half Nights": "Back Half Nights",
  "Wednesday Days": "Wednesday Days",
  "Wednesday Nights": "Wednesday Nights",
} as const

export type ShiftKey = keyof typeof SHIFT_LABELS

const SHIFT_COLOURS: Record<ShiftKey, string> = {
  "Front Half Days": "hsl(var(--chart-1))",
  "Front Half Nights": "hsl(var(--chart-2))",
  "Back Half Days": "hsl(var(--chart-3))",
  "Back Half Nights": "hsl(var(--chart-4))",
  "Wednesday Days": "hsl(var(--chart-5))",
  "Wednesday Nights": "hsl(220 70% 50%)",
}

/* Build a ChartConfig for the generic <ChartContainer /> helper  */
const chartConfig = {
  ...Object.fromEntries(
    (Object.keys(SHIFT_LABELS) as ShiftKey[]).map((key) => [
      key,
      { label: SHIFT_LABELS[key], color: SHIFT_COLOURS[key] },
    ]),
  ),
  tickets: { label: "Tickets" },
} satisfies ChartConfig & { tickets: { label: string } }

/* ------------------------------------------------------------------ */

interface ShiftDistributionChartProps {
  analysisResult: AnalysisResult
}

type Period = "1mo" | "3mo" | "6mo" | "all"

/**
 * Given the period the user selects, return the corresponding
 * `shiftCounts` slice from `analysisResult`.
 */
function getShiftCountsForPeriod(
  period: Period,
  result: AnalysisResult,
): Record<ShiftKey, number> {
  switch (period) {
    case "1mo":
      return result.last1MonthShiftCounts as Record<ShiftKey, number>
    case "3mo":
      return result.last3MonthsShiftCounts as Record<ShiftKey, number>
    case "6mo":
      return result.last6MonthsShiftCounts as Record<ShiftKey, number>
    case "all":
    default:
      return result.shiftCounts as Record<ShiftKey, number>
  }
}

export function ShiftDistributionChart({
  analysisResult,
}: ShiftDistributionChartProps) {
  const [period, setPeriod] = React.useState<Period>("6mo")

  /* ----- derive and memoise the dataset for the chosen period ----- */
  const data = React.useMemo(() => {
    const counts = getShiftCountsForPeriod(period, analysisResult)

    /* build recharts‑friendly objects & compute totals */
    const dataset = (Object.keys(SHIFT_LABELS) as ShiftKey[])
      .map((key) => ({
        shift: key,
        tickets: counts?.[key] ?? 0,
        fill: SHIFT_COLOURS[key],
      }))
      .filter((row) => row.tickets > 0)

    const total = dataset.reduce((sum, d) => sum + d.tickets, 0)

    return {
      total,
      dataset: dataset.map((d) => ({
        ...d,
        percentage: total ? (d.tickets / total) * 100 : 0,
      })),
    }
  }, [period, analysisResult])

  /* --------------------------- empty state ----------------------- */
  if (data.total === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Shift Distribution</CardTitle>
          <CardDescription>Upload data to see shift distribution</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  /* ----------------------------- render --------------------------- */
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <div className="flex w-full items-center justify-between mb-2">
          <CardTitle>Shift Distribution</CardTitle>
          <div className="flex gap-1">
            {(["1mo", "3mo", "6mo", "all"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                className="px-2 py-1 text-xs"
                onClick={() => setPeriod(p)}
              >
                {p === "all" ? "All" : p}
              </Button>
            ))}
          </div>
        </div>
        <CardDescription>
          Ticket distribution –{" "}
          {{
            "1mo": "Previous full month",
            "3mo": "Previous 3 months",
            "6mo": "Previous 6 months",
            all: "All time",
          }[period]}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const d = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: d.fill }}
                          />
                          <span className="font-medium">{d.shift}</span>
                        </div>
                        <div className="grid text-sm gap-1">
                          <div>Tickets: {d.tickets.toLocaleString()}</div>
                          <div>Percentage: {d.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />

            <Pie
              data={data.dataset}
              dataKey="tickets"
              nameKey="shift"
              innerRadius={80}
              outerRadius={140}
              strokeWidth={2}
            >
              <Label
                content={({ viewBox }) =>
                  viewBox && "cx" in viewBox && "cy" in viewBox ? (
                    <>
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-3xl font-bold"
                      >
                        {data.total.toLocaleString()}
                      </text>
                      <text
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-muted-foreground"
                      >
                        Total Tickets
                      </text>
                    </>
                  ) : null
                }
              />
            </Pie>

          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}