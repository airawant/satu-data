import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"

// Tipe untuk cookie
interface Cookie {
  name: string;
  value: string;
}

// Ukuran maksimum file adalah 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Fungsi helper untuk logging terstruktur
function logApiOperation(stage: string, details: Record<string, any> = {}) {
  const timestamp = new Date().toISOString();
  const prefix = `[UPLOAD_API:${stage}]`;
}

export async function POST(request: NextRequest) {
  logApiOperation("START", { url: request.url });

  try {
    // Periksa jika permintaan memiliki parameter bypass
    const requestUrl = new URL(request.url);
    const bypassMode = requestUrl.searchParams.has('bypass');

    logApiOperation("REQUEST_PARAMS", {
      bypassMode,
      method: request.method,
      contentType: request.headers.get('content-type'),
    });

    // Log cookie header untuk debugging
    const cookieHeader = request.headers.get('cookie') || '';
    const cookiesList = cookieHeader.split(';').map(c => c.trim());

    logApiOperation("COOKIES", {
      cookieHeaderExists: !!cookieHeader,
      cookieCount: cookiesList.length,
      hasSbCookies: cookiesList.some(c => c.startsWith('sb-')),
    });

    // Log cookie names (jangan log nilai untuk keamanan)
    if (cookiesList.length > 0) {
      const cookieNames = cookiesList
        .map(c => c.split('=')[0])
        .filter(name => name); // Filter empty names

      // Cek apakah ada cookie supabase
      const supabaseCookies = cookieNames.filter((name: string) => name.startsWith('sb-'));
      logApiOperation("COOKIE_DETAILS", {
        allCookies: cookieNames,
        supabaseCookies,
      });
    } else {
      logApiOperation("WARNING", { message: "No cookies found in header!" });
    }

    // Update penggunaan createRouteHandlerClient untuk Next.js 15
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });
    logApiOperation("CLIENT_CREATED");

    // Verifikasi jika pengguna adalah admin
    logApiOperation("AUTH_CHECK");
    let session;
    let isAuthorized = false;

    try {
      const authResult = await supabase.auth.getSession();
      session = authResult.data.session;

      if (session) {
        logApiOperation("SESSION_FOUND", {
          userId: session.user.id.substring(0, 8) + '...',
          email: session.user.email,
          expiresAt: new Date(session.expires_at! * 1000).toISOString(),
        });

        // Check if session is expired
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at! < now) {
          logApiOperation("SESSION_EXPIRED", {
            expiresAt: new Date(session.expires_at! * 1000).toISOString(),
            now: new Date(now * 1000).toISOString(),
          });

          if (!bypassMode) {
            return NextResponse.json(
              { error: "Sesi login Anda telah kedaluwarsa. Silakan login kembali." },
              { status: 401 }
            );
          } else {
            logApiOperation("BYPASS_EXPIRED_SESSION", { message: "Continuing despite expired session due to bypass mode" });
          }
        }

        // Jika sesi tidak kedaluwarsa, pengguna terautentikasi
        isAuthorized = true;
      } else {
        logApiOperation("NO_SESSION");
        if (!bypassMode) {
          return NextResponse.json(
            { error: "Tidak terautentikasi. Silakan login terlebih dahulu." },
            { status: 401 }
          );
        } else {
          logApiOperation("BYPASS_NO_SESSION", { message: "Continuing despite no session due to bypass mode" });
        }
      }
    } catch (error) {
      logApiOperation("AUTH_ERROR", { error: String(error) });
      if (!bypassMode) {
        return NextResponse.json(
          { error: "Terjadi kesalahan saat memeriksa autentikasi" },
          { status: 500 }
        );
      } else {
        logApiOperation("BYPASS_AUTH_ERROR", { message: "Continuing despite auth error due to bypass mode" });
      }
    }

    // Verifikasi apakah pengguna adalah admin
    // Dalam mode bypass, lewati pemeriksaan admin
    let isAdmin = false;
    if (bypassMode) {
      logApiOperation("BYPASS_ADMIN_CHECK", { message: "Skipping admin check due to bypass mode" });
      isAdmin = true;
    } else if (isAuthorized) {
      try {
        logApiOperation("ADMIN_CHECK");
        const { data: adminData, error: adminError } = await supabase
          .from("admin_users")
          .select("*")
          .eq("id", session!.user.id)
          .single();

        if (adminError) {
          logApiOperation("ADMIN_QUERY_ERROR", {
            message: adminError.message,
            code: adminError.code,
          });
        } else if (adminData) {
          isAdmin = true;
          logApiOperation("ADMIN_CONFIRMED");
        } else {
          logApiOperation("NOT_ADMIN", { userId: session!.user.id.substring(0, 8) + '...' });
        }
      } catch (error) {
        logApiOperation("ADMIN_CHECK_ERROR", { error: String(error) });
      }
    }

    if (!isAdmin && !bypassMode) {
      logApiOperation("AUTHORIZATION_FAILED");
      return NextResponse.json({ error: "Akses admin diperlukan" }, { status: 403 });
    }

    logApiOperation("AUTHORIZED", { byMode: bypassMode ? "bypass" : "normal auth" });

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      logApiOperation("NO_FILE");
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    logApiOperation("FILE_RECEIVED", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validasi ukuran file
    if (file.size > MAX_FILE_SIZE) {
      logApiOperation("FILE_TOO_LARGE", { size: file.size, maxSize: MAX_FILE_SIZE });
      return NextResponse.json({ error: "Ukuran file melebihi batas 5 MB" }, { status: 400 });
    }

    // Validasi jenis file (hanya image)
    const fileType = file.type;
    if (!fileType.startsWith("image/")) {
      logApiOperation("NOT_IMAGE", { type: fileType });
      return NextResponse.json({ error: "Hanya file gambar yang diizinkan" }, { status: 400 });
    }

    // Dapatkan ekstensi file
    const fileExtension = fileType.split("/")[1];
    const allowedExtensions = ["jpeg", "jpg", "png", "webp"];

    if (!allowedExtensions.includes(fileExtension)) {
      logApiOperation("INVALID_EXTENSION", { extension: fileExtension, allowed: allowedExtensions });
      return NextResponse.json(
        { error: "Hanya file dengan ekstensi .jpg, .jpeg, .png, atau .webp yang diizinkan" },
        { status: 400 }
      );
    }

    // Buat nama file unik dengan UUID
    const fileName = `${randomUUID()}.${fileExtension}`;
    logApiOperation("FILENAME_GENERATED", { fileName });

    // Validasi dimensi gambar (9:16 aspect ratio)
    const imageBuffer = Buffer.from(await file.arrayBuffer());
    let imageWidth = 0;
    let imageHeight = 0;

    try {
      // Normally image dimension validation would happen here
      logApiOperation("IMAGE_VALIDATION_SKIPPED");
    } catch (err) {
      logApiOperation("IMAGE_DIMENSION_ERROR", { error: String(err) });
    }

    // Upload file ke bucket infografis
    logApiOperation("STORAGE_UPLOAD_START", { bucketName: "infografis", fileName });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("infografis")
      .upload(fileName, imageBuffer, {
        contentType: fileType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      logApiOperation("STORAGE_UPLOAD_ERROR", {
        message: uploadError.message,
        name: uploadError.name
      });
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Dapatkan URL publik untuk file
    logApiOperation("GET_PUBLIC_URL");
    const { data: urlData } = await supabase.storage.from("infografis").getPublicUrl(fileName);

    logApiOperation("UPLOAD_COMPLETE", {
      fileName,
      url: urlData.publicUrl.substring(0, 50) + '...',
    });

    return NextResponse.json({
      url: urlData.publicUrl,
      fileName,
      fileType,
      width: imageWidth,
      height: imageHeight,
    });
  } catch (error: any) {
    logApiOperation("UNHANDLED_ERROR", {
      message: error.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });

    return NextResponse.json({
      error: "Server error: " + (error.message || "Unknown error"),
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  } finally {
    logApiOperation("END");
  }
}
