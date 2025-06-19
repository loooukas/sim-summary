"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import type { AnalysisResult } from "@/lib/data-analysis"
import { calculateExpectedResults, getMonthlyAverageForPeriod } from "@/lib/data-analysis"

interface CalculationVerificationProps {
  analysisResult: AnalysisResult
  isTestData?: boolean
}

export function CalculationVerification({ analysisResult, isTestData = false }: CalculationVerificationProps) {
  if (!isTestData) return null

  const expected = calculateExpectedResults()
  const chart6MonthAvg = getMonthlyAverageForPeriod(analysisResult, 6)

  // Calculate 6-month total from chart data
  const sortedMonths = Object.keys(analysisResult.monthlyTickets).sort().slice(-6)
  const actual6MonthTotal = sortedMonths.reduce((sum, month) => sum + (analysisResult.monthlyTickets[month] || 0), 0)

  const verifications = [
    {
      name: "YTD Total",
      expected: expected.expectedYTD,
      actual: analysisResult.ytdCount,
      tolerance: 0,
    },
    {
      name: "6-Month Total",
      expected: expected.expected6MonthTotal,
      actual: actual6MonthTotal,
      tolerance: 0,
    },
    {
      name: "6-Month Average",
      expected: expected.expected6MonthAvg,
      actual: chart6MonthAvg,
      tolerance: 0.1,
    },
    {
      name: "Monthly Average (Stats)",
      expected: expected.expected6MonthAvg,
      actual: analysisResult.avgMonthly,
      tolerance: 0.1,
    },
  ]

  const getStatus = (expected: number, actual: number, tolerance: number) => {
    const diff = Math.abs(expected - actual)
    if (diff <= tolerance) return "pass"
    if (diff <= tolerance * 2) return "warning"
    return "fail"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "fail":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "fail":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🧪 Calculation Verification
          <Badge variant="outline" className="text-xs">
            Test Data Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground mb-4">
            Verifying calculations against expected values:
            <br />
            <span className="text-xs font-medium">
              Key Check: YTD ({expected.expectedYTD}) should be ≤ 6-Month Total ({expected.expected6MonthTotal})
            </span>
          </div>

          {verifications.map((verification, index) => {
            const status = getStatus(verification.expected, verification.actual, verification.tolerance)
            const diff = Math.abs(verification.expected - verification.actual)

            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status)}
                  <div>
                    <div className="font-medium">{verification.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Expected: {verification.expected.toFixed(1)} | Actual: {verification.actual.toFixed(1)} | Diff:{" "}
                      {diff.toFixed(1)}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(status)}>{status.toUpperCase()}</Badge>
              </div>
            )
          })}

          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <div className="text-sm font-medium mb-2">Expected vs Actual Summary:</div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium">Expected:</div>
                <div>YTD: {expected.expectedYTD}</div>
                <div>6-Month Total: {expected.expected6MonthTotal}</div>
                <div>6-Month Avg: {expected.expected6MonthAvg.toFixed(1)}</div>
              </div>
              <div>
                <div className="font-medium">Actual:</div>
                <div>YTD: {analysisResult.ytdCount}</div>
                <div>6-Month Total: {actual6MonthTotal}</div>
                <div>6-Month Avg: {chart6MonthAvg.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
