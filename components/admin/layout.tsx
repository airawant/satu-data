"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AdminProtectedPage } from "./admin-protected-page"
import { ChevronLeft, Home, Settings, Users, LayoutDashboard, BarChart4, FileImage, Upload } from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Daftar menu admin
//   const adminMenuItems = [
//     { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4 mr-2" /> },
//     { label: "Infografis", href: "/admin/infografis", icon: <FileImage className="w-4 h-4 mr-2" /> },
//     { label: "Upload Infografis", href: "/admin/upload-infografis", icon: <Upload className="w-4 h-4 mr-2" /> },
//     { label: "Upload Dataset", href: "/admin/upload-dataset", icon: <Upload className="w-4 h-4 mr-2" /> },
//     { label: "Konfigurasi Tabel", href: "/admin/dynamic-table-config", icon: <BarChart4 className="w-4 h-4 mr-2" /> },
//     { label: "Pengguna", href: "/admin/users", icon: <Users className="w-4 h-4 mr-2" /> },
//   ]

  return (
    <AdminProtectedPage redirectPath="/admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b dark:border-gray-800">
          <div className="container py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                aria-label="Kembali"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Main content */}
          <main className="w-full">
            {children}
          </main>
        </div>
      </div>
    </AdminProtectedPage>
  )
}
