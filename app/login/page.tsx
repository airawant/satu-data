// Server Component
import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"

// Nonaktifkan prerendering untuk halaman login
export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Memuat halaman login...</p>
            </div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
