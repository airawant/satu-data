import { NextRequest, NextResponse } from 'next/server';
import { getDatasetById, updateDataset, deleteDataset } from '@/lib/services/dataset-service';

interface Context {
  params: {
    id: string;
  };
}

/**
 * GET /api/datasets/[id]
 * Mengambil dataset berdasarkan ID
 */
export async function GET(request: NextRequest, context: Context) {
  const params = await context.params;
  const { id } = params;

  try {
    const dataset = await getDatasetById(id);
    return NextResponse.json(dataset);
  } catch (error: any) {
    console.error(`Error fetching dataset with id ${id}:`, error);
    // Jika error adalah 'not found', kembalikan 404
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: `Dataset dengan id ${id} tidak ditemukan` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/datasets/[id]
 * Memperbarui dataset berdasarkan ID
 */
export async function PUT(request: NextRequest, context: Context) {
  const params = await context.params;
  const { id } = params;

  try {
    // Pastikan dataset ada
    try {
      await getDatasetById(id);
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: `Dataset dengan id ${id} tidak ditemukan` },
          { status: 404 }
        );
      }
      throw error;
    }

    const body = await request.json();

    const updatedDataset = await updateDataset(id, body);
    return NextResponse.json(updatedDataset);
  } catch (error) {
    console.error(`Error updating dataset with id ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update dataset' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/datasets/[id]
 * Menghapus dataset berdasarkan ID
 */
export async function DELETE(request: NextRequest, context: Context) {
  const params = await context.params;
  const { id } = params;

  try {
    // Pastikan dataset ada
    try {
      await getDatasetById(id);
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: `Dataset dengan id ${id} tidak ditemukan` },
          { status: 404 }
        );
      }
      throw error;
    }

    await deleteDataset(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting dataset with id ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete dataset' },
      { status: 500 }
    );
  }
}
