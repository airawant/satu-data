import { NextRequest, NextResponse } from 'next/server';
import {
  getTableConfigById,
  updateTableConfig,
  deleteTableConfig
} from '@/lib/services/table-config-service';

interface Context {
  params: {
    id: string;
  };
}

export async function GET(_: NextRequest, context: Context) {
  try {
    const { id } = context.params;

    const tableConfig = await getTableConfigById(id);

    if (!tableConfig) {
      return NextResponse.json(
        { error: 'Konfigurasi tabel tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(tableConfig);
  } catch (error) {
    console.error(`API Error - GET /api/table-configs/${context.params.id}:`, error);
    return NextResponse.json(
      { error: 'Gagal mengambil konfigurasi tabel' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: Context) {
  try {
    const { id } = context.params;
    const data = await req.json();

    // Check if table config exists
    const existingConfig = await getTableConfigById(id);

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Konfigurasi tabel tidak ditemukan' },
        { status: 404 }
      );
    }

    // Update table config
    const updatedConfig = await updateTableConfig(id, data);

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error(`API Error - PUT /api/table-configs/${context.params.id}:`, error);
    return NextResponse.json(
      { error: 'Gagal memperbarui konfigurasi tabel' },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, context: Context) {
  try {
    const { id } = context.params;

    // Check if table config exists
    const existingConfig = await getTableConfigById(id);

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Konfigurasi tabel tidak ditemukan' },
        { status: 404 }
      );
    }

    // Delete table config
    await deleteTableConfig(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`API Error - DELETE /api/table-configs/${context.params.id}:`, error);
    return NextResponse.json(
      { error: 'Gagal menghapus konfigurasi tabel' },
      { status: 500 }
    );
  }
}
