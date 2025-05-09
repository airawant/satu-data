"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Table,
  FileSearch,
  Database,
  ArrowUpRight,
  Users,
  Clock,
  CalendarDays,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

// Tipe data untuk statistik
interface StatItem {
  title: string
  value: string
  change: string
  changeDirection: "up" | "down" | "neutral"
  progress: number
  icon: React.ElementType
}

const statsData: StatItem[] = [
  {
    title: "Total Dataset",
    value: "127",
    change: "+4 sejak bulan lalu",
    changeDirection: "up",
    progress: 80,
    icon: Database,
  },
  {
    title: "Tabel Dinamis",
    value: "84",
    change: "+12 sejak bulan lalu",
    changeDirection: "up",
    progress: 65,
    icon: Table,
  },
  {
    title: "Visualisasi",
    value: "56",
    change: "+8 sejak bulan lalu",
    changeDirection: "up",
    progress: 55,
    icon: BarChart3,
  },
  {
    title: "Infografis",
    value: "42",
    change: "+5 sejak bulan lalu",
    changeDirection: "up",
    progress: 45,
    icon: FileSearch,
  },
]

// Tipe data untuk aktivitas terakhir
interface ActivityItem {
  id: number
  user: string
  action: string
  item: string
  time: string
  avatar?: string
}

const recentActivities: ActivityItem[] = [
  {
    id: 1,
    user: "Ahmad Dahlan",
    action: "membuat",
    item: "tabel dinamis",
    time: "10 menit yang lalu",
  },
  {
    id: 2,
    user: "Kartini",
    action: "mengedit",
    item: "visualisasi data",
    time: "30 menit yang lalu",
  },
  {
    id: 3,
    user: "Soekarno",
    action: "mengunggah",
    item: "dataset baru",
    time: "1 jam yang lalu",
  },
  {
    id: 4,
    user: "Hatta",
    action: "mengunduh",
    item: "laporan statistik",
    time: "2 jam yang lalu",
  },
]

// Tipe data untuk pengumuman
interface AnnouncementItem {
  id: number
  title: string
  content: string
  date: string
  icon: React.ElementType
  type?: "info" | "warning" | "event"
}

const announcements: AnnouncementItem[] = [
  {
    id: 1,
    title: "Pembaruan Dataset Ekonomi",
    content: "Dataset Indikator Ekonomi telah diperbarui dengan data terbaru hingga Q1 2024.",
    date: "15 April 2024",
    icon: Database,
    type: "info",
  },
  {
    id: 2,
    title: "Pelatihan Query Builder",
    content: "Pelatihan online penggunaan Query Builder akan diadakan pada tanggal 25 April 2024 pukul 10.00 WIB.",
    date: "25 April 2024",
    icon: CalendarDays,
    type: "event",
  },
  {
    id: 3,
    title: "Pemeliharaan Sistem",
    content: "Portal akan mengalami pemeliharaan pada tanggal 30 April 2024 pukul 22.00-24.00 WIB.",
    date: "30 April 2024",
    icon: Clock,
    type: "warning",
  },
]

// Komponen untuk menampilkan statistik
export function QuickStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stat.changeDirection === "up" && <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />}
              <span className={stat.changeDirection === "up" ? "text-emerald-500" : ""}>{stat.change}</span>
            </div>
            <Progress value={stat.progress} className="mt-2 h-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Komponen untuk menampilkan aktivitas terakhir
export function RecentActivities() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5 text-primary" />
          Aktivitas Terbaru
        </CardTitle>
        <CardDescription>Aktivitas pengguna terkini di platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 border-b pb-4 last:border-0 last:pb-0">
              <div className="relative h-10 w-10 rounded-full bg-primary/10">
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary">
                  {activity.user.charAt(0)}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="font-medium">{activity.item}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          Lihat Semua Aktivitas
        </Button>
      </CardFooter>
    </Card>
  )
}

// Komponen untuk menampilkan pengumuman
export function Announcements() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarDays className="mr-2 h-5 w-5 text-primary" />
          Pengumuman
        </CardTitle>
        <CardDescription>Informasi dan berita terbaru</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((item) => (
            <div key={item.id} className="flex items-start space-x-4 border-b pb-4 last:border-0 last:pb-0">
              <div className="rounded-full bg-primary/10 p-2">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.content}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          Lihat Semua Pengumuman
        </Button>
      </CardFooter>
    </Card>
  )
}

// Komponen Overview utama
export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <QuickStats />

      <div className="grid gap-6 md:grid-cols-2">
        <Announcements />
        <RecentActivities />
      </div>
    </div>
  )
}
