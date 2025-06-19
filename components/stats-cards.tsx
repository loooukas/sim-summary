"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Calendar, Clock, BarChart3 } from "lucide-react"

interface StatsCardsProps {
  ytdTotal: number
  monthlyAvg: number
  weeklyAvg: number
  avgResolutionTime: number
}

export function StatsCards({ ytdTotal, monthlyAvg, weeklyAvg, avgResolutionTime }: StatsCardsProps) {
  const stats = [
    {
      title: "YTD Total",
      value: ytdTotal.toLocaleString(),
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Monthly Average",
      value: monthlyAvg.toFixed(1),
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Weekly Average",
      value: weeklyAvg.toFixed(1),
      icon: BarChart3,
      color: "text-purple-600",
    },
    {
      title: "Avg Resolution Time",
      value: `${avgResolutionTime.toFixed(1)}h`,
      icon: Clock,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
