"use client"

import type { TicketData } from "./data-analysis"

export function generateTestData(): TicketData[] {
  const testData: TicketData[] = [
    {
      IssueId: "0d02a622-442c-4ba4-8689-9dbcc3c055bd",
      CreateDate: "2025-05-22T13:51:18.467Z",
      ResolvedDate: "2025-05-22T18:13:10.848Z",
      Title: "Flex conveyor",
    },
    {
      IssueId: "049db675-d7a7-44e0-befa-3da9b24a7c4c",
      CreateDate: "2021-11-23T10:47:53.733Z",
      ResolvedDate: "2021-11-23T12:27:19.773Z",
      Title: "Flex conveyor into DD 178 and DD 179 is having issues with the rollers.",
    },
    {
      IssueId: "0cf29a55-2217-4c9b-94c7-1b187d31c24d",
      CreateDate: "2023-04-07T14:26:25.872Z",
      ResolvedDate: "2023-04-08T13:41:33.557Z",
      Title: "Flex conveyor DD108",
    },
    {
      IssueId: "17d62433-b105-4382-bace-df00873fd27b",
      CreateDate: "2023-12-03T15:51:29.194Z",
      ResolvedDate: "2023-12-03T19:29:01.143Z",
      Title: "Conveyor Maintenance",
    },
    {
      IssueId: "1c1a09f7-9417-4b78-9564-4d8f2d47eea1",
      CreateDate: "2021-12-21T23:56:06.434Z",
      ResolvedDate: "2021-12-22T11:27:12.781Z",
      Title: "SBD2 OB FLEX Conveyors",
    },
    {
      IssueId: "03d3e74d-0448-4b16-9a59-dbb834520bc6",
      CreateDate: "2021-10-12T07:45:22.761Z",
      ResolvedDate: "2021-10-12T11:39:15.953Z",
      Title: "Floor conveyor is not working at tail sort at DD179",
    },
  ]

  // Add more realistic test data for better verification
  const currentDate = new Date("2025-06-17")
  const additionalData: TicketData[] = []

  // Generate YTD data (2025 only) - should be less than 6-month total
  for (let month = 0; month < 5; month++) {
    for (let day = 1; day <= 20; day++) {
      const createDate = new Date(2025, month, day, 10, 0, 0)
      const resolveDate = new Date(createDate.getTime() + 4 * 60 * 60 * 1000) // 4 hours later

      additionalData.push({
        IssueId: `ytd-${month}-${day}`,
        CreateDate: createDate.toISOString(),
        ResolvedDate: resolveDate.toISOString(),
        Title: `YTD Test Ticket ${month}-${day}`,
      })
    }
  }

  // Generate last 6 months data (should include some 2024 data)
  for (let monthsBack = 0; monthsBack < 6; monthsBack++) {
    const targetDate = new Date(currentDate)
    targetDate.setMonth(targetDate.getMonth() - monthsBack)

    for (let day = 1; day <= 15; day++) {
      const createDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day, 14, 0, 0)
      const resolveDate = new Date(createDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours later

      additionalData.push({
        IssueId: `6mo-${monthsBack}-${day}`,
        CreateDate: createDate.toISOString(),
        ResolvedDate: resolveDate.toISOString(),
        Title: `6-Month Test Ticket ${monthsBack}-${day}`,
      })
    }
  }

  return [...testData, ...additionalData]
}

export function calculateExpectedResults() {
  const testData = generateTestData()
  const currentDate = new Date("2025-06-17")
  const ytdStart = new Date(2025, 0, 1)
  const sixMonthsAgo = new Date(currentDate.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)

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
