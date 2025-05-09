import { NextResponse } from 'next/server';
import { getAllDatasets, createDataset } from '@/lib/services/dataset-service';

// GET /api/datasets - mendapatkan semua dataset
export async function GET() {
  try {
    const datasets = await getAllDatasets();
    return NextResponse.json(datasets);
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

// POST /api/datasets - membuat dataset baru
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('Dataset yang akan dibuat:', JSON.stringify({
      name: body.name,
      category: body.category,
      source: body.source,
      description: body.description?.substring(0, 50) + (body.description?.length > 50 ? '...' : ''),
      variables_length: body.variables?.length,
      content_length: body.content?.length
    }, null, 2));

    // Validasi data yang diperlukan
    if (!body.name || !body.category || !body.source || !body.content || !body.variables) {
      const missingFields = [];
      if (!body.name) missingFields.push('name');
      if (!body.category) missingFields.push('category');
      if (!body.source) missingFields.push('source');
      if (!body.content) missingFields.push('content');
      if (!body.variables) missingFields.push('variables');

      console.error('Validasi gagal:', missingFields);

      return NextResponse.json(
        { error: `Data tidak lengkap. ${missingFields.join(', ')} diperlukan` },
        { status: 400 }
      );
    }

    // Pastikan content adalah array
    if (!Array.isArray(body.content)) {
      return NextResponse.json(
        { error: 'Format content tidak valid. Harus berupa array.' },
        { status: 400 }
      );
    }

    // Pastikan variables memiliki format yang benar
    if (!Array.isArray(body.variables)) {
      return NextResponse.json(
        { error: 'Format variables tidak valid. Harus berupa array.' },
        { status: 400 }
      );
    }

    const formattedVariables = body.variables.map((variable: any) => ({
      id: variable.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: variable.name,
      type: variable.type || 'dimension',
      dataType: variable.dataType || 'string',
      selected: variable.selected !== undefined ? variable.selected : true
    }));

    // Log environment variables (tanpa menampilkan nilai sensitif)
    console.log('Environment variables for Supabase:', {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    const newDataset = await createDataset({
      name: body.name,
      description: body.description || "",
      category: body.category,
      source: body.source,
      content: body.content,
      variables: formattedVariables
    });

    return NextResponse.json(newDataset, { status: 201 });
  } catch (error: any) {
    console.error('Error creating dataset:', error);
    // Log detail error untuk debugging
    if (error.message) console.error('Error message:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.details) console.error('Error details:', error.details);

    // Jika error RLS, berikan instruksi yang lebih jelas
    if (error.code === '42501' && error.message?.includes('violates row-level security policy')) {
      return NextResponse.json(
        {
          error: 'Akses ditolak: Kebijakan keamanan database menolak operasi ini. ' +
                'Pastikan Anda memiliki izin admin dan telah login dengan benar, ' +
                'atau hubungi administrator untuk menambahkan SUPABASE_SERVICE_ROLE_KEY.'
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: `Failed to create dataset: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
