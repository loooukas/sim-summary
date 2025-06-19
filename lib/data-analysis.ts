export interface TicketData {
  CreateDate: string
  ResolvedDate: string
  [key: string]: any
}

export interface AnalysisResult {
  ytdCount: number
  last6MonthsCount: number
  last6MonthsAvgResolutionTime: number
  last4WeeksCount: number
  avgMonthly: number
  avgWeekly: number
  avgResolutionTime: number // Added this field
  shiftCounts: Record<string, number>
  last1MonthShiftCounts: Record<string, number>
  last3MonthsShiftCounts: Record<string, number>
  last6MonthsShiftCounts: Record<string, number>
  monthlyTickets: Record<string, number>
  monthlyResolveTimes: Record<string, number[]>
  weeklyTickets: Record<string, number>
  weeklyResolveTimes: Record<string, number[]>
  currentMonthCount: number
  currentMonthProgress: number
  projectedCurrentMonth: number
  trendVsAverage: number
  trendPercentage: number
  totalProcessedRows: number
  totalValidRows: number
  processedTickets: ProcessedTicket[]
  last6CalendarMonthsCount: number
  last4CalendarWeeksCount: number
}

interface ProcessedTicket {
  createDate: Date
  resolveDate: Date
  resolveTime: number
  shift: string
  monthKey: string
  weekKey: string
}

export function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== "string") return false
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100
}

export function getShift(date: Date): string {
  const dayOfWeek = date.getDay()
  const hour = date.getHours()
  const minute = date.getMinutes()

  const timeOfDay = hour * 100 + minute
  const isDayShift = 430 <= timeOfDay && timeOfDay < 1630

  if ([0, 1, 2].includes(dayOfWeek)) {
    return isDayShift ? "Front Half Days" : "Front Half Nights"
  } else if ([4, 5, 6].includes(dayOfWeek)) {
    return isDayShift ? "Back Half Days" : "Back Half Nights"
  } else {
    return isDayShift ? "Wednesday Days" : "Wednesday Nights"
  }
}

function getWeekStart(date: Date): Date {
  const dayOfWeek = date.getDay()
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

export function analyzeTicketData(data: TicketData[]): AnalysisResult {
  const currentDate = new Date()
  let ytdCount = 0
  let last6MonthsCount = 0
  const last4WeeksCount = 0
  let currentMonthCount = 0
  let totalProcessedRows = 0
  let totalValidRows = 0

  const shiftCounts: Record<string, number> = {}
  const last1MonthShiftCounts: Record<string, number> = {}
  const last3MonthsShiftCounts: Record<string, number> = {}
  const last6MonthsShiftCounts: Record<string, number> = {}
  const monthlyTickets: Record<string, number> = {}
  const monthlyResolveTimes: Record<string, number[]> = {}
  const weeklyTickets: Record<string, number> = {}
  const weeklyResolveTimes: Record<string, number[]> = {}
  const processedTickets: ProcessedTicket[] = []

  const ytdStart = new Date(currentDate.getFullYear(), 0, 1)
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const last6MonthsStart = new Date(currentDate)
  last6MonthsStart.setMonth(last6MonthsStart.getMonth() - 6)
  const last1MonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate())
  const last3MonthsStart = new Date(currentDate.getTime() - 3 * 30 * 24 * 60 * 60 * 1000)

  const totalDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const currentMonthProgress = currentDate.getDate() / totalDaysInMonth

  let totalResolutionTime = 0
  let validTicketCount = 0

  data.forEach((item) => {
    totalProcessedRows++

    if (!item.CreateDate || !item.ResolvedDate) return

    if (!isValidDate(item.CreateDate) || !isValidDate(item.ResolvedDate)) return

    const createDate = new Date(item.CreateDate)
    const resolveDate = new Date(item.ResolvedDate)

    if (isNaN(createDate.getTime()) || isNaN(resolveDate.getTime())) return

    totalValidRows++

    const resolveTime = (resolveDate.getTime() - createDate.getTime()) / (1000 * 60 * 60)
    totalResolutionTime += resolveTime
    validTicketCount++

    const monthKey = createDate.toISOString().slice(0, 7)
    const weekStart = getWeekStart(createDate)
    const weekKey = weekStart.toISOString().slice(0, 10)

    const shift = getShift(createDate)

    processedTickets.push({
      createDate,
      resolveDate,
      resolveTime,
      shift,
      monthKey,
      weekKey,
    })

    shiftCounts[shift] = (shiftCounts[shift] || 0) + 1

    if (createDate >= last1MonthStart) {
      last1MonthShiftCounts[shift] = (last1MonthShiftCounts[shift] || 0) + 1
    }

    if (createDate >= last3MonthsStart) {
      last3MonthsShiftCounts[shift] = (last3MonthsShiftCounts[shift] || 0) + 1
    }

    if (createDate >= last6MonthsStart) {
      last6MonthsShiftCounts[shift] = (last6MonthsShiftCounts[shift] || 0) + 1
    }

    monthlyTickets[monthKey] = (monthlyTickets[monthKey] || 0) + 1
    if (!monthlyResolveTimes[monthKey]) {
      monthlyResolveTimes[monthKey] = []
    }
    monthlyResolveTimes[monthKey].push(resolveTime)

    weeklyTickets[weekKey] = (weeklyTickets[weekKey] || 0) + 1
    if (!weeklyResolveTimes[weekKey]) {
      weeklyResolveTimes[weekKey] = []
    }
    weeklyResolveTimes[weekKey].push(resolveTime)

    if (createDate >= ytdStart) {
      ytdCount++
    }

    if (createDate >= last6MonthsStart) {
      last6MonthsCount++
    }

    if (createDate >= currentMonthStart) {
      currentMonthCount++
    }
  })

  const avgMonthly = Object.values(monthlyTickets).reduce((a, b) => a + b, 0) / Object.keys(monthlyTickets).length || 0
  const avgWeekly = Object.values(weeklyTickets).reduce((a, b) => a + b, 0) / Object.keys(weeklyTickets).length || 0
  const avgResolutionTime = totalResolutionTime / validTicketCount || 0

  const projectedCurrentMonth = currentMonthProgress > 0 ? currentMonthCount / currentMonthProgress : 0
  const trendVsAverage = projectedCurrentMonth - avgMonthly
  const trendPercentage = avgMonthly > 0 ? (trendVsAverage / avgMonthly) * 100 : 0

  const last6CalendarMonthsCount = Object.entries(monthlyTickets)
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .slice(-6)
    .reduce((acc, [, count]) => acc + count, 0)

  const last4CalendarWeeksCount = Object.entries(weeklyTickets)
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .slice(-4)
    .reduce((acc, [, count]) => acc + count, 0)

  return {
    ytdCount,
    last6MonthsCount,
    last6MonthsAvgResolutionTime: 0,
    last4WeeksCount,
    avgMonthly,
    avgWeekly,
    avgResolutionTime, // Make sure this is included in the return
    shiftCounts,
    last1MonthShiftCounts,
    last3MonthsShiftCounts,
    last6MonthsShiftCounts,
    monthlyTickets,
    monthlyResolveTimes,
    weeklyTickets,
    weeklyResolveTimes,
    currentMonthCount,
    currentMonthProgress,
    projectedCurrentMonth,
    trendVsAverage,
    trendPercentage,
    totalProcessedRows,
    totalValidRows,
    processedTickets,
    last6CalendarMonthsCount,
    last4CalendarWeeksCount,
  }
}

import { generateTestData } from "./test-data"

export function calculateExpectedResults() {
  const testData = generateTestData()
  const currentDate = new Date("2025-06-17")
  const ytdStart = new Date(2025, 0, 1)
  const sixMonthsAgo = new Date(currentDate)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  let ytdCount = 0
  let sixMonthCount = 0
  const monthlyBreakdown: Record<string, number> = {}

  testData.forEach((ticket) => {
    const createDate = new Date(ticket.CreateDate)
    if (isNaN(createDate.getTime())) return

    const monthKey = createDate.toISOString().slice(0, 7)
    monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + 1

    if (createDate >= ytdStart && createDate <= currentDate) {
      ytdCount++
    }

    if (createDate >= sixMonthsAgo && createDate <= currentDate) {
      sixMonthCount++
    }
  })

  const last6Months = Object.keys(monthlyBreakdown)
    .sort()
    .slice(-6)
    .map((month) => ({ month, count: monthlyBreakdown[month] }))

  const sixMonthTotal = last6Months.reduce((sum, m) => sum + m.count, 0)
  const sixMonthAvg = sixMonthTotal / 6

  return {
    expectedYTD: ytdCount,
    expected6MonthTotal: sixMonthTotal,
    expected6MonthAvg: sixMonthAvg,
    monthlyBreakdown: last6Months,
    totalTickets: testData.length,
  }
}

export function getMonthlyAverageForPeriod(analysisResult: AnalysisResult, months: number): number {
  const sortedMonths = Object.keys(analysisResult.monthlyTickets).sort().slice(-months)
  const totalTickets = sortedMonths.reduce((sum, month) => sum + (analysisResult.monthlyTickets[month] || 0), 0)
  return totalTickets / months
}
