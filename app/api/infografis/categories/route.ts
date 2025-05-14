import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Gunakan createServerClient dari @supabase/ssr yang lebih kompatibel dengan Next.js 15
    // Tambahkan await pada cookies() karena mengembalikan Promise di Next.js 15
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Ambil semua kategori unik dari infografis
    const { data, error } = await supabase
      .from("infografis")
      .select("category")
      .order("category")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Ekstrak kategori unik
    const categories = Array.from(new Set(data.map(item => item.category)))

    // Jika tidak ada kategori yang ditemukan, kembalikan kategori default
    if (categories.length === 0) {
      const defaultCategories = [
        "Sosial",
        "Ekonomi",
        "Pendidikan",
        "Kesehatan",
        "Keagamaan",
        "Demografi"
      ]
      return NextResponse.json({ data: defaultCategories })
    }

    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
