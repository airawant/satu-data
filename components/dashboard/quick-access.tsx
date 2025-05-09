"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Table,
  FileSearch,
  PieChart,
  LayoutDashboard,
  Database,
  BookOpen,
  Users,
  ArrowRight
} from "lucide-react"

// Tipe data untuk pintasan
interface ShortcutItem {
  title: string
  description: string
  icon: React.ElementType
  link: string
  color: string
  textColor: string
}

const shortcuts: ShortcutItem[] = [
  {
    title: "Tabel Dinamis",
    description: "Buat tabel dari dataset yang tersedia",
    icon: Table,
    link: "/query-builder",
    color: "bg-blue-100 dark:bg-blue-900",
    textColor: "text-blue-600 dark:text-blue-300",
  },
  {
    title: "Buat Visualisasi",
    description: "Buat grafik dari dataset yang tersedia",
    icon: BarChart3,
    link: "/charts",
    color: "bg-green-100 dark:bg-green-900",
    textColor: "text-green-600 dark:text-green-300",
  },
  {
    title: "Jelajahi Data",
    description: "Lihat dan eksplorasi dataset yang tersedia",
    icon: FileSearch,
    link: "/data-explorer",
    color: "bg-purple-100 dark:bg-purple-900",
    textColor: "text-purple-600 dark:text-purple-300",
  },
  {
    title: "Infografis",
    description: "Lihat infografis yang tersedia",
    icon: PieChart,
    link: "/infografis",
    color: "bg-orange-100 dark:bg-orange-900",
    textColor: "text-orange-600 dark:text-orange-300",
  },
]

// Tipe data untuk menu admin
interface AdminMenuItem {
  title: string
  description: string
  icon: React.ElementType
  link: string
}

const adminMenuItems: AdminMenuItem[] = [
  {
    title: "Unggah Dataset",
    description: "Tambahkan dataset baru ke sistem",
    icon: Database,
    link: "/admin/upload-dataset?bypass=true",
  },
  {
    title: "Kelola Infografis",
    description: "Unggah dan kelola infografis",
    icon: PieChart,
    link: "/admin/upload-infografis?bypass=true",
  },
  {
    title: "Konfigurasi Tabel",
    description: "Atur konfigurasi tabel dinamis",
    icon: Table,
    link: "/admin/dynamic-table-config?bypass=true",
  },
  {
    title: "Kelola Pengguna",
    description: "Tambah dan kelola pengguna portal",
    icon: Users,
    link: "/admin/users?bypass=true",
  },
]

export function QuickAccess() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <LayoutDashboard className="mr-2 h-5 w-5 text-primary" />
          Akses Cepat
        </CardTitle>
        <CardDescription>Pintasan untuk fitur-fitur utama</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {shortcuts.map((item, index) => (
            <Link key={index} href={item.link}>
              <div className="flex cursor-pointer items-start space-x-4 rounded-lg border p-3 transition-all hover:bg-accent">
                <div className={`rounded-lg p-2 ${item.color}`}>
                  <item.icon className={`h-5 w-5 ${item.textColor}`} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminMenu() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5 text-primary" />
          Menu Admin
        </CardTitle>
        <CardDescription>Akses cepat ke fungsi administrasi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {adminMenuItems.map((item, index) => (
            <Link key={index} href={item.link}>
              <div className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all hover:bg-accent">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
