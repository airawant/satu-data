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

    // Ambil semua tag dari infografis
    const { data, error } = await supabase
      .from("infografis")
      .select("tags")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Ekstrak dan gabungkan semua tag
    const allTags = data
      .flatMap(item => item.tags || [])
      .filter(tag => tag && tag.trim() !== "")

    // Ekstrak tag unik dan mengurutkannya
    const uniqueTags = Array.from(new Set(allTags)).sort()

    // Jika tidak ada tag yang ditemukan, kembalikan tag default
    if (uniqueTags.length === 0) {
      const defaultTags = [
        "Statistik",
        "Infografis",
        "Visualisasi Data",
        "Kementerian Agama",
        "Data"
      ]
      return NextResponse.json({ data: defaultTags })
    }

    return NextResponse.json({ data: uniqueTags })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
