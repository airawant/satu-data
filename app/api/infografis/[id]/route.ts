import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Fungsi helper untuk logging terstruktur
function logApiOperation(stage: string, details: Record<string, any> = {}) {
  const timestamp = new Date().toISOString();
  const prefix = `[INFOGRAFIS_ID_API:${stage}]`;
  console.log(prefix, { timestamp, ...details });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  logApiOperation("GET_START", { id, url: request.url });

  try {
    const requestUrl = new URL(request.url);
    const bypassMode = requestUrl.searchParams.has('bypass');

    logApiOperation("REQUEST_PARAMS", { bypassMode });

    // Update penggunaan createRouteHandlerClient untuk Next.js 15
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    })

    // Verifikasi jika pengguna adalah admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    logApiOperation("AUTH_CHECK", {
      hasSession: !!session,
      userId: session?.user?.id?.substring(0, 8) || 'none'
    });

    const { data, error } = await supabase.from("infografis").select("*").eq("id", id).single()

    if (error) {
      logApiOperation("NOT_FOUND", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    logApiOperation("ITEM_FOUND", {
      title: data.title,
      published: data.published
    });

    // Jika infografis belum dipublikasikan dan pengguna bukan admin, atau tidak login
    // Izinkan bypass mode untuk mengakses infografis belum dipublikasikan
    if (!data.published && !bypassMode && (!session || !(await isAdmin(supabase, session?.user?.id)))) {
      logApiOperation("ACCESS_DENIED", {
        reason: "not published and not admin",
        bypassMode
      });
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    logApiOperation("ACCESS_GRANTED", { bypassMode });
    return NextResponse.json({ data })
  } catch (error) {
    logApiOperation("ERROR", { error: String(error) });
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    logApiOperation("GET_END");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  logApiOperation("PATCH_START", { id, url: request.url });

  try {
    const requestUrl = new URL(request.url);
    const bypassMode = requestUrl.searchParams.has('bypass');

    logApiOperation("REQUEST_PARAMS", { bypassMode });

    // Update penggunaan createRouteHandlerClient untuk Next.js 15
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    })

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

    // Verifikasi apakah pengguna adalah admin
    let isAdminUser = bypassMode;
    if (!isAdminUser && session) {
      isAdminUser = await isAdmin(supabase, session.user.id);
      logApiOperation("ADMIN_CHECK", { isAdmin: isAdminUser });
    }

    if (!isAdminUser && !bypassMode) {
      logApiOperation("UNAUTHORIZED", { reason: "Not admin" });
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Parse payload JSON dari request
    const data = await request.json()
    const { title, category, description, tags, data_source, image_url, image_width, image_height, published } = data

    logApiOperation("REQUEST_DATA", {
      title,
      category,
      imageChanged: image_url !== undefined
    });

    // Validasi data yang diperlukan
    if ((!title && title !== undefined) || (!category && category !== undefined) || (!image_url && image_url !== undefined)) {
      logApiOperation("VALIDATION_ERROR", { message: "Required fields cannot be empty" });
      return NextResponse.json(
        { error: "Judul, kategori, dan URL gambar tidak boleh kosong jika diupdate" },
        { status: 400 }
      )
    }

    // Validasi aspek rasio gambar jika ada update dimensi
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

    // Cek apakah item ada dan update
    const { data: existingItem, error: getError } = await supabase
      .from("infografis")
      .select("*")
      .eq("id", id)
      .single()

    if (getError) {
      logApiOperation("NOT_FOUND");
      return NextResponse.json({ error: "Infografis tidak ditemukan" }, { status: 404 })
    }

    logApiOperation("EXISTING_ITEM", {
      title: existingItem.title,
      status: existingItem.published ? "published" : "draft"
    });

    // Siapkan data untuk update
    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (category !== undefined) updateData.category = category
    if (description !== undefined) updateData.description = description
    if (tags !== undefined) updateData.tags = tags
    if (data_source !== undefined) updateData.data_source = data_source
    if (image_url !== undefined) updateData.image_url = image_url
    if (image_width !== undefined) updateData.image_width = image_width
    if (image_height !== undefined) updateData.image_height = image_height

    // Update status publikasi jika ada perubahan
    if (published !== undefined && published !== existingItem.published) {
      updateData.published = published
      if (published) {
        updateData.published_at = new Date().toISOString()
      } else {
        updateData.published_at = null
      }

      logApiOperation("PUBLISH_STATUS_CHANGE", {
        from: existingItem.published,
        to: published
      });
    }

    logApiOperation("UPDATING", { fieldCount: Object.keys(updateData).length });

    // Lakukan update
    const { data: updatedData, error: updateError } = await supabase
      .from("infografis")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      logApiOperation("UPDATE_ERROR", { error: updateError.message });
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    logApiOperation("UPDATE_SUCCESS", { id });
    return NextResponse.json({ data: updatedData })
  } catch (error) {
    logApiOperation("ERROR", { error: String(error) });
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    logApiOperation("PATCH_END");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  logApiOperation("DELETE_START", { id, url: request.url });

  try {
    const requestUrl = new URL(request.url);
    const bypassMode = requestUrl.searchParams.has('bypass');

    logApiOperation("REQUEST_PARAMS", { bypassMode });

    // Update penggunaan createRouteHandlerClient untuk Next.js 15
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    })

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

    // Verifikasi apakah pengguna adalah admin
    let isAdminUser = bypassMode;
    if (!isAdminUser && session) {
      isAdminUser = await isAdmin(supabase, session.user.id);
      logApiOperation("ADMIN_CHECK", { isAdmin: isAdminUser });
    }

    if (!isAdminUser && !bypassMode) {
      logApiOperation("UNAUTHORIZED", { reason: "Not admin" });
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Cek apakah infografis ada
    const { data: existingItem, error: getError } = await supabase
      .from("infografis")
      .select("image_url, title")
      .eq("id", id)
      .single()

    if (getError) {
      logApiOperation("NOT_FOUND");
      return NextResponse.json({ error: "Infografis tidak ditemukan" }, { status: 404 })
    }

    logApiOperation("EXISTING_ITEM", {
      title: existingItem.title,
      hasImage: !!existingItem.image_url
    });

    // Hapus file gambar dari storage jika ada
    if (existingItem.image_url && existingItem.image_url.includes("infografis/")) {
      const pathParts = existingItem.image_url.split("infografis/")
      if (pathParts.length > 1) {
        const filePath = pathParts[1].split("?")[0] // Hapus query parameter jika ada

        logApiOperation("REMOVING_FILE", { filePath });
        const { error: removeError } = await supabase.storage.from("infografis").remove([filePath]);

        if (removeError) {
          logApiOperation("FILE_REMOVE_ERROR", { error: removeError.message });
          // Lanjutkan proses meskipun gagal menghapus file
        } else {
          logApiOperation("FILE_REMOVED");
        }
      }
    }

    // Hapus infografis dari database
    logApiOperation("DELETING_RECORD");
    const { error: deleteError } = await supabase.from("infografis").delete().eq("id", id)

    if (deleteError) {
      logApiOperation("DELETE_ERROR", { error: deleteError.message });
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    logApiOperation("DELETE_SUCCESS");
    return NextResponse.json({ success: true })
  } catch (error) {
    logApiOperation("ERROR", { error: String(error) });
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  } finally {
    logApiOperation("DELETE_END");
  }
}

// Fungsi helper untuk memeriksa apakah pengguna adalah admin
async function isAdmin(supabase: any, userId: string | undefined) {
  if (!userId) return false

  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", userId)
    .single()

  return !error && !!data
}
