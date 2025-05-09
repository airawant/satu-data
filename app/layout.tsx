import type React from "react"
import "@/app/globals.css"
import { Mona_Sans as FontSans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { DatasetProvider } from "@/contexts/dataset-context"
import { SavedItemsProvider } from "@/contexts/saved-items-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata = {
  generator: "Satu Data Portal Kemenag Tanjungpinang",
  description: "Portal Satu Data Kantor Kementerian Kota Tanjungpinang",
  icons: {
    icon: "/logo.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head />
      <body
        className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <DatasetProvider>
              <SavedItemsProvider>
                {children}
              </SavedItemsProvider>
            </DatasetProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
