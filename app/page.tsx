"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { StatsCards } from "@/components/stats-cards"
import { ShiftDistributionChart } from "@/components/shift-distribution-chart"
import { MonthlyBreakdownChart } from "@/components/monthly-breakdown-chart"
import { ShiftDistributionTable } from "@/components/shift-distribution-table"
import { MonthlyBreakdownTable } from "@/components/monthly-breakdown-table"
import { analyzeTicketData, type AnalysisResult, type TicketData } from "@/lib/data-analysis"

export default function TicketAnalysisDashboard() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const handleFileUpload = (data: TicketData[]) => {
    console.log("Starting analysis with", data.length, "rows of data")

    try {
      const result = analyzeTicketData(data)
      console.log("Analysis completed successfully")
      console.log("Analysis result:", result)
      setAnalysisResult(result)
    } catch (error) {
      console.error("Error during analysis:", error)
      alert("Error analyzing the data. Please check the console for details.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Ticket Analysis Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Upload your CSV data to analyze ticket patterns and performance metrics
          </p>
        </div>

        <FileUpload onFileUpload={handleFileUpload} hasData={!!analysisResult} />

        {analysisResult ? (
          <div className="space-y-8 animate-in fade-in-50 duration-500">
            <StatsCards
              ytdTotal={analysisResult.ytdCount}
              monthlyAvg={analysisResult.avgMonthly}
              weeklyAvg={analysisResult.avgWeekly}
              avgResolutionTime={analysisResult.avgResolutionTime || 0}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ShiftDistributionChart analysisResult={analysisResult} />
              <MonthlyBreakdownChart analysisResult={analysisResult} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ShiftDistributionTable shiftCounts={analysisResult.shiftCounts} />
              <MonthlyBreakdownTable
                monthlyTickets={analysisResult.monthlyTickets}
                monthlyResolveTimes={analysisResult.monthlyResolveTimes}
              />
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <div>
                Processed {analysisResult.totalValidRows} valid rows out of {analysisResult.totalProcessedRows} total
                rows
              </div>
              <div className="mt-1 font-mono">
                YTD: {analysisResult.ytdCount} | Last 6 Months: {analysisResult.last6CalendarMonthsCount} | Last 4
                Weeks: {analysisResult.last4CalendarWeeksCount}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">Upload a CSV file to begin analyzing your ticket data</div>
          </div>
        )}
      </div>
    </div>
  )
}
