"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Buka Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="flex items-center gap-2 mb-6 pl-6 pt-2">
          <Image
            src="/logo.png"
            alt="Logo Kemenag Tanjungpinang"
            width={32}
            height={32}
            className="rounded-sm"
          />
          <span className="font-bold text-sm">Satu Data Kemenag</span>
        </div>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              className={cn(
                "flex items-center text-lg font-medium transition-colors hover:text-primary",
                pathname === "/" ? "text-primary" : "text-muted-foreground",
              )}
              onClick={() => setOpen(false)}
            >
              Beranda
            </Link>
            <Link
              href="/infografis"
              className={cn(
                "flex items-center text-lg font-medium transition-colors hover:text-primary",
                pathname?.includes("/infografis") ? "text-primary" : "text-muted-foreground",
              )}
              onClick={() => setOpen(false)}
            >
              Infografis
            </Link>
            <Link
              href="/query-builder"
              className={cn(
                "flex items-center text-lg font-medium transition-colors hover:text-primary",
                pathname === "/query-builder" ? "text-primary" : "text-muted-foreground",
              )}
              onClick={() => setOpen(false)}
            >
              Tabel Dinamis
            </Link>
            <Link
              href="/charts"
              className={cn(
                "flex items-center text-lg font-medium transition-colors hover:text-primary",
                pathname === "/charts" ? "text-primary" : "text-muted-foreground",
              )}
              onClick={() => setOpen(false)}
            >
              Grafik
            </Link>

            {/* Menu Admin hanya tampil jika sudah login */}
            {!isLoading && user && (
              <>
                <div className="h-px w-full bg-border my-2"></div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Menu Admin</p>
                <Link
                  href="/admin/dashboard?bypass=true"
                  className={cn(
                    "flex items-center text-lg font-medium transition-colors hover:text-primary",
                    pathname === "/admin/dashboard" ? "text-primary" : "text-muted-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/data-explorer?bypass=true"
                  className={cn(
                    "flex items-center text-lg font-medium transition-colors hover:text-primary",
                    pathname === "/data-explorer" ? "text-primary" : "text-muted-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  Eksplorasi Data
                </Link>
                <Link
                  href="/admin/upload-dataset"
                  className={cn(
                    "flex items-center text-lg font-medium transition-colors hover:text-primary",
                    pathname === "/admin/upload-dataset" ? "text-primary" : "text-muted-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  Unggah Dataset
                </Link>
                <Link
                  href="/admin/upload-infografis"
                  className={cn(
                    "flex items-center text-lg font-medium transition-colors hover:text-primary",
                    pathname === "/admin/upload-infografis" ? "text-primary" : "text-muted-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  Unggah Infografis
                </Link>
                <Link
                  href="/admin/dynamic-table-config"
                  className={cn(
                    "flex items-center text-lg font-medium transition-colors hover:text-primary",
                    pathname === "/admin/dynamic-table-config" ? "text-primary" : "text-muted-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  Konfigurasi Tabel
                </Link>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
