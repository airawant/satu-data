"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const announcements = [
  {
    id: 1,
    title: "Pembaruan Dataset Haji Kantor Kementerian Kota Tanjungpinang",
    content: "Dataset telah diperbarui dengan data terbaru hingga 2025.",
    date: "09 Mei 2025",
    type: "info",
    icon: Info,
  },
//   {
//     id: 2,
//     title: "Pelatihan Query Builder",
//     content: "Pelatihan online penggunaan Query Builder akan diadakan pada tanggal 25 April 2024 pukul 10.00 WIB.",
//     date: "25 April 2024",
//     type: "event",
//     icon: Calendar,
//   },
  {
    id: 3,
    title: "Pemeliharaan Sistem",
    content: "Portal akan mengalami pemeliharaan pada tanggal 30 April 2025 pukul 22.00-24.00 WIB.",
    date: "30 April 2025",
    type: "warning",
    icon: AlertTriangle,
  },
]

export function Announcements() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5 text-primary" />
          Pengumuman
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="border-b pb-4 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium">{announcement.title}</h3>
                <Badge
                  variant={announcement.type === "warning" ? "destructive" : "secondary"}
                  className={cn(
                    announcement.type === "info" && "bg-blue-500",
                    announcement.type === "event" && "bg-green-500",
                  )}
                >
                  {announcement.type === "info" && "Info"}
                  {announcement.type === "event" && "Event"}
                  {announcement.type === "warning" && "Penting"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{announcement.content}</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <announcement.icon className="h-3 w-3 mr-1" />
                <span>{announcement.date}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
