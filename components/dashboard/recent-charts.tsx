"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, LineChart, PieChart, Share2 } from "lucide-react"

const recentCharts = [
  {
    id: 1,
    title: "Population Growth by Region",
    type: "bar",
    creator: "John Doe",
    date: "2 hours ago",
    views: 128,
  },
  {
    id: 2,
    title: "Economic Indicators 2023",
    type: "line",
    creator: "Jane Smith",
    date: "Yesterday",
    views: 256,
  },
  {
    id: 3,
    title: "Budget Allocation by Department",
    type: "pie",
    creator: "Alex Johnson",
    date: "3 days ago",
    views: 512,
  },
  {
    id: 4,
    title: "Healthcare Statistics by Province",
    type: "bar",
    creator: "Sarah Williams",
    date: "1 week ago",
    views: 1024,
  },
]

export function RecentCharts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Charts</CardTitle>
        <CardDescription>Charts created or viewed recently.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentCharts.map((chart) => (
            <div key={chart.id} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-md bg-muted">
                  {chart.type === "bar" && <BarChart3 className="h-5 w-5 text-primary" />}
                  {chart.type === "line" && <LineChart className="h-5 w-5 text-secondary" />}
                  {chart.type === "pie" && <PieChart className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">{chart.title}</p>
                  <div className="flex items-center pt-1">
                    <Avatar className="h-4 w-4 mr-1">
                      <AvatarImage src="/placeholder.svg?height=16&width=16" alt={chart.creator} />
                      <AvatarFallback>{chart.creator[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground">
                      {chart.creator} • {chart.date}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Share</span>
                </Button>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
