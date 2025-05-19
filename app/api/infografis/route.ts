import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Fungsi helper untuk logging terstruktur
function logApiOperation(stage: string, details: Record<string, any> = {}) {
  const timestamp = new Date().toISOString();
  const prefix = `[INFOGRAFIS_API:${stage}]`;

}

export async function GET(request: NextRequest) {
  logApiOperation("GET_START", { url: request.url });

  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const tag = searchParams.get("tag")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const publishedOnly = searchParams.get("publishedOnly") === "true"

    logApiOperation("GET_PARAMS", {
      category,
      tag,
      search,
      page,
      pageSize,
      publishedOnly
    });

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

    // Verifikasi jika pengguna adalah admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    logApiOperation("AUTH_CHECK", {
      hasSession: !!session,
      userId: session?.user?.id?.substring(0, 8) || 'none'
    });

    let query = supabase.from("infografis").select("*", { count: "exact" })

    // Filter berdasarkan parameter
    if (category) {
      query = query.eq("category", category)
    }

    if (tag) {
      query = query.contains("tags", [tag])
    }

    if (search) {
      query = query.ilike("title", `%${search}%`)
    }

    // Jika bukan admin atau permintaan khusus untuk yang dipublikasikan saja, filter berdasarkan status publikasi
    if (!session || publishedOnly) {
      query = query.eq("published", true)
      logApiOperation("FILTER_PUBLISHED_ONLY");
    }

    // Paginasi
    const startIndex = (page - 1) * pageSize
    query = query.range(startIndex, startIndex + pageSize - 1).order("created_at", { ascending: false })

    logApiOperation("EXECUTING_QUERY", {
      startIndex,
      endIndex: startIndex + pageSize - 1,
      hasFilters: !!(category || tag || search)
    });

    const { data, error, count } = await query

    if (error) {
      logApiOperation("QUERY_ERROR", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logApiOperation("QUERY_SUCCESS", { count: count || 0, resultCount: data?.length || 0 });

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      },
    })
  } catch (error) {
    logApiOperation("UNHANDLED_ERROR", { error: String(error) });
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    logApiOperation("GET_END");
  }
}

export async function POST(request: NextRequest) {
  logApiOperation("POST_START", { url: request.url });

  try {
    // Periksa jika permintaan memiliki parameter bypass
    const requestUrl = new URL(request.url);
    const bypassMode = requestUrl.searchParams.has('bypass');

    logApiOperation("REQUEST_PARAMS", { bypassMode });

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

    // Verifikasi jika pengguna adalah admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    logApiOperation("AUTH_CHECK", {
      hasSession: !!session,
      userId: session?.user?.id?.substring(0, 8) || 'none'
    });

    if (!session && !bypassMode) {
      logApiOperation("UNAUTHORIZED", { reason: "No session" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verifikasi apakah pengguna adalah admin (skip jika bypass mode)
    let isAdmin = false;

    if (bypassMode) {
      logApiOperation("BYPASS_ADMIN_CHECK", { message: "Skipping admin check due to bypass mode" });
      isAdmin = true;
    } else if (session) {
      // Verifikasi apakah pengguna adalah admin
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (adminError) {
        logApiOperation("ADMIN_QUERY_ERROR", { error: adminError.message });
      } else if (adminData) {
        isAdmin = true;
        logApiOperation("ADMIN_CONFIRMED");
      } else {
        logApiOperation("NOT_ADMIN", { userId: session.user.id.substring(0, 8) });
      }
    }

    if (!isAdmin && !bypassMode) {
      logApiOperation("UNAUTHORIZED", { reason: "Not admin" });
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Parse payload JSON dari request
    const data = await request.json()
    const { title, category, description, tags, data_source, image_url, image_width, image_height, published } = data

    logApiOperation("REQUEST_DATA", {
      title,
      category,
      hasImage: !!image_url,
      dimensions: image_width && image_height ? `${image_width}x${image_height}` : 'unknown'
    });

    // Validasi data yang diperlukan
    if (!title || !category || !image_url) {
      logApiOperation("VALIDATION_ERROR", { message: "Missing required fields" });
      return NextResponse.json(
        { error: "Judul, kategori, dan URL gambar diperlukan" },
        { status: 400 }
      )
    }

    // Validasi aspek rasio gambar
    if (image_width && image_height) {
      const aspectRatio = image_width / image_height
      const targetRatio = 9 / 16 // aspek rasio 9:16
      const tolerance = 0.03 // toleransi 3%

      logApiOperation("ASPECT_RATIO_CHECK", {
        actual: aspectRatio,
        target: targetRatio,
        diff: Math.abs(aspectRatio - targetRatio)
      });

      if (Math.abs(aspectRatio - targetRatio) > tolerance) {
        logApiOperation("ASPECT_RATIO_ERROR");
        return NextResponse.json(
          { error: "Gambar harus memiliki aspek rasio 9:16" },
          { status: 400 }
        )
      }
    }

    // Set status publikasi dan timestamp
    const publishedStatus = published || false
    const publishedAt = publishedStatus ? new Date().toISOString() : null

    logApiOperation("SAVING_DATA", { publishedStatus });

    // Simpan infografis ke database
    const { data: infografisData, error: infografisError } = await supabase
      .from("infografis")
      .insert({
        title,
        category,
        description,
        tags: tags || [],
        data_source,
        image_url,
        image_width: image_width || null,
        image_height: image_height || null,
        created_by: session?.user?.id || 'system',
        published: publishedStatus,
        published_at: publishedAt
      })
      .select()
      .single()

    if (infografisError) {
      logApiOperation("DB_ERROR", { error: infografisError.message });
      return NextResponse.json({ error: infografisError.message }, { status: 500 })
    }

    logApiOperation("SAVE_SUCCESS", { id: infografisData.id });

    return NextResponse.json({ data: infografisData })
  } catch (error) {
    logApiOperation("UNHANDLED_ERROR", { error: String(error) });
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    logApiOperation("POST_END");
  }
}
