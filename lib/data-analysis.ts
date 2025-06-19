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
  shiftCounts: Record<ShiftLabel, number>
  last1MonthShiftCounts: Record<ShiftLabel, number>
  last3MonthsShiftCounts: Record<ShiftLabel, number>
  last6MonthsShiftCounts: Record<ShiftLabel, number>
  monthlyTickets: Record<string, number>
  monthlyResolveTimes: Record<string, number[]>
  /** @deprecated – use monthlyStats instead */
  monthlyLastSix: { month: string; tickets: number; avgResolve: number }[]
  /** Last 6 full calendar months – oldest→newest */
  monthlyStats: MonthlyStat[]
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

export interface MonthlyStat {
  /** YYYY-MM-01 */
  monthStart: string;
  /** e.g. “Dec 2024” */
  label: string;
  totalTickets: number;
  avgResolutionHrs: number;
}

interface ProcessedTicket {
  createDate: Date
  resolveDate: Date
  resolveTime: number
  shift: string
  monthKey: string
  weekKey: string
}


import { generateTestData } from "./test-data"

/**
 * Parse an ISO timestamp in the form “YYYY-MM-DDTHH:mm:ss” **as local time**.
 * The built‑in Date parser treats such strings as UTC in some runtimes,
 * which shifts the calendar day and breaks our shift mapping.
 * Returns `null` when the string doesn't match the expected shape.
 */
function parseLocalISO(iso: string): Date | null {
  const m =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/u.exec(iso.trim());
  if (!m) return null;
  const [, y, M, d, h, mi, s] = m.map(Number);
  return new Date(y, M - 1, d, h, mi, s);
}

/** ---------- Canonical shift list shared across UI & logic ---------- */
export const SHIFT_LABELS = [
  "Front Half Days",
  "Front Half Nights",
  "Back Half Days",
  "Back Half Nights",
  "Wednesday Days",
  "Wednesday Nights",
] as const;

/** Utility to pre‑fill a shift count record with zeros */
function makeShiftRecord(): Record<ShiftLabel, number> {
  return {
    "Front Half Days": 0,
    "Front Half Nights": 0,
    "Back Half Days": 0,
    "Back Half Nights": 0,
    "Wednesday Days": 0,
    "Wednesday Nights": 0,
  };
}

export type ShiftLabel = (typeof SHIFT_LABELS)[number];

export function isValidDate(dateString: string): boolean {
  return !!parseLocalISO(dateString);
}

export function getShift(date: Date): ShiftLabel {
  const dayOfWeek = date.getDay()        // 0 = Sun … 6 = Sat
  const minutes  = date.getHours() * 60 + date.getMinutes()
  const isDay    = minutes >= 270 && minutes < 990  // 04:30‑16:29

  if ([0, 1, 2].includes(dayOfWeek)) {
    return isDay ? "Front Half Days" : "Front Half Nights"
  }
  if ([4, 5, 6].includes(dayOfWeek)) {
    return isDay ? "Back Half Days"  : "Back Half Nights"
  }
  // Wednesday
  return isDay ? "Wednesday Days" : "Wednesday Nights"
}

function getWeekStart(date: Date): Date {
  // Clone the original date so the caller’s object remains unchanged
  const start = new Date(date);
  const day = start.getDay();                    // 0 = Sun … 6 = Sat
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);                    // normalise to midnight
  return start;
}

/**
 * Builds stats for the last `monthsBack` *full* calendar months (excludes the
 * current month).  Oldest month first.
 */
function buildMonthlyStats(
  monthlyTickets: Record<string, number>,
  monthlyResolveTimes: Record<string, number[]>,
  currentDate: Date,
  monthsBack = 6
): MonthlyStat[] {
  // start at first day of *previous* month so current month is excluded
  const cursor = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const stats: MonthlyStat[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const start = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    const key   = start.toISOString().slice(0, 7);          // "YYYY-MM"
    const label = start.toLocaleString('default', { month: 'short', year: 'numeric' });

    const total = monthlyTickets[key] ?? 0;
    const times = monthlyResolveTimes[key] ?? [];
    const avg   = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    stats.push({
      monthStart: `${key}-01`,
      label,
      totalTickets: total,
      avgResolutionHrs: +avg.toFixed(2),
    });
  }
  return stats;
}

export function analyzeTicketData(data: TicketData[]): AnalysisResult {
  const currentDate = new Date()
  let ytdCount = 0
  let last6MonthsCount = 0
  let currentMonthCount = 0
  let totalProcessedRows = 0
  let totalValidRows = 0

  const shiftCounts: Record<ShiftLabel, number>       = makeShiftRecord();
  const last1MonthShiftCounts: Record<ShiftLabel, number> = makeShiftRecord();
  const last3MonthsShiftCounts: Record<ShiftLabel, number> = makeShiftRecord();
  const last6MonthsShiftCounts: Record<ShiftLabel, number> = makeShiftRecord();
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

    const createDate  = parseLocalISO(item.CreateDate)  ?? new Date(NaN);
    const resolveDate = parseLocalISO(item.ResolvedDate)?? new Date(NaN);

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
    // DEBUG - log first 30 rows
if (totalProcessedRows <= 30) {
  console.log(
    `[DEBUG] ${item.CreateDate}  →  ${shift}`
  );
}

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

  // Ensure every recognised shift key exists, even if zero
  SHIFT_LABELS.forEach((s) => {
    shiftCounts[s]           = shiftCounts[s]           || 0
    last1MonthShiftCounts[s] = last1MonthShiftCounts[s] || 0
    last3MonthsShiftCounts[s] = last3MonthsShiftCounts[s] || 0
    last6MonthsShiftCounts[s] = last6MonthsShiftCounts[s] || 0
  })

  // --- monthly stats (Dec‑May right now) ----------------------------
  const monthlyStats = buildMonthlyStats(
    monthlyTickets,
    monthlyResolveTimes,
    currentDate,
    6
  );

  const last6MonthsAvgResolutionTime = monthlyStats.reduce(
    (sum, m) => sum + m.avgResolutionHrs,
    0
  ) / (monthlyStats.length || 1);

  const last6CalendarMonthsCount = Object.entries(monthlyTickets)
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .slice(-6)
    .reduce((acc, [, count]) => acc + count, 0)

  const last4CalendarWeeksCount = Object.entries(weeklyTickets)
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .slice(-4)
    .reduce((acc, [, count]) => acc + count, 0)

  const last4WeeksCount = last4CalendarWeeksCount;

  return {
    ytdCount,
    last6MonthsCount,
    last6MonthsAvgResolutionTime,
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
    monthlyStats,
    monthlyLastSix: monthlyStats.map(m => ({
      month: m.label,
      tickets: m.totalTickets,
      avgResolve: m.avgResolutionHrs,
    })),
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
