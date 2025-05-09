"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  // Log state untuk debugging
  console.log('MainNav state:', { user: !!user, isLoading, pathname })

  return (
    <NavigationMenu className={cn("flex-1", className)}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link
            href="/"
              className={cn(
                navigationMenuTriggerStyle(),
              pathname === "/" && "bg-accent text-accent-foreground",
              )}
            >
            Beranda
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link
            href="/infografis"
              className={cn(
                navigationMenuTriggerStyle(),
              pathname?.includes("/infografis") && "bg-accent text-accent-foreground",
              )}
            >
            Infografis
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              (pathname?.includes("/query-builder") || pathname?.includes("/statistik-tabel")) &&
                "bg-accent text-accent-foreground",
            )}
          >
            Data
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    href="/query-builder"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium">Tabel Dinamis</div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Buat tabel dinamis dari dataset yang tersedia
                    </p>
                </Link>
              </li>
              <li>
                <Link
                  href="/query-builder"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/query-builder" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Tabel Dinamis</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Buat tabel dinamis dari dataset yang tersedia
                    </p>
                </Link>
              </li>
              <li>
                <Link
                  href="/statistik-tabel"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/statistik-tabel" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Tabel Statistik</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Lihat dan kelola tabel statistik yang telah disimpan
                    </p>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              (pathname?.includes("/charts") ||
                pathname?.includes("/statistik-grafik")) &&
                "bg-accent text-accent-foreground",
            )}
          >
            Visualisasi
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    href="/charts"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium">Visualisasi Data</div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Buat visualisasi data yang interaktif dan informatif
                    </p>
                </Link>
              </li>
              <li>
                <Link
                  href="/charts"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/charts" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Pembuat Grafik</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Buat berbagai jenis grafik dari dataset yang tersedia
                    </p>
                </Link>
              </li>
              <li>
                <Link
                  href="/statistik-grafik"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/statistik-grafik" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Katalog Grafik</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Lihat dan kelola grafik yang telah disimpan
                    </p>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Menu Admin hanya tampil jika sudah login dan loading selesai */}
        {!isLoading && user && (
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              (pathname === "/admin/upload-dataset" ||
                pathname === "/admin/upload-infografis" ||
                  pathname === "/admin/dynamic-table-config" ||
                  pathname === "/dashboard" ||
                  pathname === "/data-explorer") &&
                "bg-accent text-accent-foreground",
            )}
          >
            Admin
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-4">
                  <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    href="/dashboard"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium">Dashboard Admin</div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Akses panel admin untuk mengelola data dan konten Portal Satu Data
                    </p>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/dashboard" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Dashboard</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Akses dashboard admin dengan ringkasan data dan fitur
                    </p>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/data-explorer?bypass=true"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/data-explorer" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Eksplorasi Data</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Jelajahi dataset yang tersedia di sistem
                    </p>
                  </Link>
              </li>
              <li>
                  <Link
                    href="/admin/upload-dataset?bypass=true"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/admin/upload-dataset" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Unggah Dataset</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Unggah dataset baru ke dalam sistem
                    </p>
                </Link>
              </li>
              <li>
                  <Link
                    href="/admin/upload-infografis?bypass=true"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/admin/upload-infografis" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Unggah Infografis</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Unggah infografis baru ke dalam sistem
                    </p>
                </Link>
              </li>
              <li>
                  <Link
                    href="/admin/dynamic-table-config?bypass=true"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/admin/dynamic-table-config" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Konfigurasi Tabel Dinamis</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Konfigurasi dataset untuk tabel dinamis
                    </p>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
