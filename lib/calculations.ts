"use client"

export interface TicketData {
  CreateDate: string
  ResolvedDate: string
  [key: string]: any
}

export interface CalculationResults {
  // Raw counts
  ytdCount: number
  last6MonthsCount: number
  last4WeeksCount: number
  currentMonthCount: number

  // Averages
  monthlyAverage: number
  weeklyAverage: number
  avgResolutionTime: number

  // Trend analysis
  currentMonthProgress: number
  projectedCurrentMonth: number
  trendPercentage: number

  // Breakdowns
  monthlyBreakdown: Record<string, number>
  shiftBreakdown: Record<string, number>
  last6MonthsShiftBreakdown: Record<string, number>

  // Meta
  totalProcessed: number
  totalValid: number
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

export function calculateAllMetrics(data: TicketData[]): CalculationResults {
  const currentDate = new Date()

  // Initialize all counters
  let ytdCount = 0
  let last6MonthsCount = 0
  let last4WeeksCount = 0
  let currentMonthCount = 0
  let totalValid = 0
  let totalResolutionTime = 0
  let resolutionTimeCount = 0

  const monthlyBreakdown: Record<string, number> = {}
  const shiftBreakdown: Record<string, number> = {}
  const last6MonthsShiftBreakdown: Record<string, number> = {}

  // Time boundaries
  const ytdStart = new Date(currentDate.getFullYear(), 0, 1)
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const last4WeeksStart = new Date(currentDate.getTime() - 28 * 24 * 60 * 60 * 1000)
  const last6MonthsStart = new Date(currentDate.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)

  // Calculate current month progress
  const totalDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const currentMonthProgress = currentDate.getDate() / totalDaysInMonth

  // Process each ticket
  data.forEach((row) => {
    if (!row.CreateDate || !row.ResolvedDate) return
    if (!isValidDate(row.CreateDate) || !isValidDate(row.ResolvedDate)) return

    const createDate = new Date(row.CreateDate)
    const resolveDate = new Date(row.ResolvedDate)

    if (isNaN(createDate.getTime()) || isNaN(resolveDate.getTime())) return
    if (createDate > currentDate || resolveDate < createDate) return

    totalValid++

    // Calculate resolution time
    const resolveTime = (resolveDate.getTime() - createDate.getTime()) / (1000 * 60 * 60)
    totalResolutionTime += resolveTime
    resolutionTimeCount++

    // Get month key and shift
    const monthKey = createDate.toISOString().slice(0, 7)
    const shift = getShift(createDate)

    // Update monthly breakdown
    monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + 1

    // Update shift breakdown
    shiftBreakdown[shift] = (shiftBreakdown[shift] || 0) + 1

    // YTD count
    if (createDate >= ytdStart) {
      ytdCount++
    }

    // Current month count
    if (createDate >= currentMonthStart) {
      currentMonthCount++
    }

    // Last 4 weeks count
    if (createDate >= last4WeeksStart) {
      last4WeeksCount++
    }

    // Last 6 months count
    if (createDate >= last6MonthsStart) {
      last6MonthsCount++
      last6MonthsShiftBreakdown[shift] = (last6MonthsShiftBreakdown[shift] || 0) + 1
    }
  })

  // Calculate averages
  const avgResolutionTime = resolutionTimeCount > 0 ? totalResolutionTime / resolutionTimeCount : 0
  const monthlyAverage = last6MonthsCount / 6
  const weeklyAverage = last4WeeksCount / 4

  // Calculate trend
  const projectedCurrentMonth = currentMonthProgress > 0 ? currentMonthCount / currentMonthProgress : 0
  const trendPercentage = monthlyAverage > 0 ? ((projectedCurrentMonth - monthlyAverage) / monthlyAverage) * 100 : 0

  return {
    ytdCount,
    last6MonthsCount,
    last4WeeksCount,
    currentMonthCount,
    monthlyAverage,
    weeklyAverage,
    avgResolutionTime,
    currentMonthProgress,
    projectedCurrentMonth,
    trendPercentage,
    monthlyBreakdown,
    shiftBreakdown,
    last6MonthsShiftBreakdown,
    totalProcessed: data.length,
    totalValid,
  }
}
