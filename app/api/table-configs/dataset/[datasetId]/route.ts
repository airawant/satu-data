import { NextRequest, NextResponse } from 'next/server';
import { getTableConfigsByDatasetId } from '@/lib/services/table-config-service';

interface Context {
  params: {
    datasetId: string;
  };
}

export async function GET(_: NextRequest, context: Context) {
  try {
    const { datasetId } = context.params;

    const tableConfigs = await getTableConfigsByDatasetId(datasetId);

    return NextResponse.json(tableConfigs);
  } catch (error) {
    console.error(`API Error - GET /api/table-configs/dataset/${context.params.datasetId}:`, error);
    return NextResponse.json(
      { error: 'Gagal mengambil konfigurasi tabel untuk dataset' },
      { status: 500 }
    );
  }
}
