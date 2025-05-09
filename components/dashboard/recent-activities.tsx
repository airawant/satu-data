"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BarChart3, Download, FileSpreadsheet, LineChart, PieChart } from "lucide-react"

const activities = [
  {
    id: 1,
    user: {
      name: "Arief Irawan",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "JD",
    },
    action: "membuat grafik baru",
    item: "Data Haji Kota Tanjungpinang",
    time: "2 jam yang lalu",
    icon: BarChart3,
    iconColor: "text-primary",
  },
//   {
//     id: 2,
//     user: {
//       name: "Sarah Williams",
//       avatar: "/placeholder.svg?height=32&width=32",
//       initials: "SW",
//     },
//     action: "mengunduh dataset",
//     item: "Statistik Kesehatan 2023",
//     time: "4 jam yang lalu",
//     icon: Download,
//     iconColor: "text-secondary",
//   },
//   {
//     id: 3,
//     user: {
//       name: "Alex Johnson",
//       avatar: "/placeholder.svg?height=32&width=32",
//       initials: "AJ",
//     },
//     action: "membuat kueri baru",
//     item: "Tingkat Pendidikan per Kabupaten",
//     time: "Kemarin, 15:30",
//     icon: FileSpreadsheet,
//     iconColor: "text-primary",
//   },
//   {
//     id: 4,
//     user: {
//       name: "Maria Garcia",
//       avatar: "/placeholder.svg?height=32&width=32",
//       initials: "MG",
//     },
//     action: "membagikan visualisasi",
//     item: "Tren Inflasi 2020-2023",
//     time: "Kemarin, 10:15",
//     icon: LineChart,
//     iconColor: "text-secondary",
//   },
//   {
//     id: 5,
//     user: {
//       name: "David Kim",
//       avatar: "/placeholder.svg?height=32&width=32",
//       initials: "DK",
//     },
//     action: "membuat grafik baru",
//     item: "Distribusi Anggaran per Sektor",
//     time: "2 hari yang lalu",
//     icon: PieChart,
//     iconColor: "text-primary",
//   },
]

export function RecentActivities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                <AvatarFallback>{activity.user.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  <span className="font-semibold">{activity.user.name}</span> {activity.action}
                </p>
                <div className="flex items-center pt-1">
                  <activity.icon className={`h-4 w-4 mr-1 ${activity.iconColor}`} />
                  <p className="text-sm text-muted-foreground">{activity.item}</p>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
