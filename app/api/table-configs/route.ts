import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTableConfigs,
  createTableConfig
} from '@/lib/services/table-config-service';

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = req.nextUrl.searchParams;
    const datasetId = searchParams.get('dataset_id');

    // Get all table configs or filter by dataset_id if provided
    const tableConfigs = await getAllTableConfigs();

    // Filter by dataset_id if provided
    const filteredConfigs = datasetId
      ? tableConfigs.filter(config => config.dataset_id === datasetId)
      : tableConfigs;

    return NextResponse.json(filteredConfigs);
  } catch (error) {
    console.error('API Error - GET /api/table-configs:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil konfigurasi tabel' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.dataset_id) {
      return NextResponse.json(
        { error: 'dataset_id diperlukan' },
        { status: 400 }
      );
    }

    if (!data.title) {
      return NextResponse.json(
        { error: 'title diperlukan' },
        { status: 400 }
      );
    }

    if (!data.title_field) {
      return NextResponse.json(
        { error: 'title_field diperlukan' },
        { status: 400 }
      );
    }

    if (!data.row_field) {
      return NextResponse.json(
        { error: 'row_field diperlukan' },
        { status: 400 }
      );
    }

    if (!data.characteristic_fields || !Array.isArray(data.characteristic_fields)) {
      return NextResponse.json(
        { error: 'characteristic_fields diperlukan dan harus berupa array' },
        { status: 400 }
      );
    }

    // Create table config
    const newTableConfig = await createTableConfig({
      dataset_id: data.dataset_id,
      title: data.title,
      description: data.description,
      title_field: data.title_field,
      row_field: data.row_field,
      characteristic_fields: data.characteristic_fields,
      aggregation_method: data.aggregation_method || 'sum',
      is_active: data.is_active !== false,
      display_order: data.display_order || 0,
      layout_config: data.layout_config,
      filter_config: data.filter_config,
      visualization_config: data.visualization_config
    });

    return NextResponse.json(newTableConfig, { status: 201 });
  } catch (error) {
    console.error('API Error - POST /api/table-configs:', error);
    return NextResponse.json(
      { error: 'Gagal membuat konfigurasi tabel' },
      { status: 500 }
    );
  }
}
