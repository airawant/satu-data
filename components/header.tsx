import Link from "next/link";
import Image from "next/image";
import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import { UserNav } from "@/components/user-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { DatasetStatus } from "@/components/ui/dataset-status";
import { Database } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-3 mr-6">
        <Database className="h-6 w-6 text-primary" />
          <Image
            src="/logo.png"
            alt="Logo Kemenag Tanjungpinang"
            width={36}
            height={36}
            className="rounded-sm"
          />
          <span className="hidden font-bold sm:inline-block">Satu Data Kemenag Tanjungpinang</span>
        </Link>
        <div className="hidden md:flex">
          <MainNav />
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <DatasetStatus />
          <ModeToggle />
          <UserNav />
        </div>
        <div className="md:hidden ml-2">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
