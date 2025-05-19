import { supabase, supabaseAdmin } from '@/lib/supabase';

export type DatasetVariable = {
  id: string;
  name: string;
  type: "dimension" | "measure";
  dataType: "string" | "number" | "date";
  selected: boolean;
};

export type Dataset = {
  id?: string;
  name: string;
  category: string;
  source: string;
  description: string;
  content: Record<string, any>[];
  variables: DatasetVariable[];
  created_at?: string;
  updated_at?: string;
};

/**
 * Mengambil semua dataset dari database
 */
export async function getAllDatasets() {
  try {
    // Gunakan supabaseAdmin jika tersedia untuk bypass RLS, jika tidak gunakan supabase normal
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(formatDatasetFromDb);
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw error;
  }
}

/**
 * Mengambil dataset berdasarkan ID
 */
export async function getDatasetById(id: string) {
  try {
    // Gunakan supabaseAdmin jika tersedia untuk bypass RLS, jika tidak gunakan supabase normal
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('datasets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return formatDatasetFromDb(data);
  } catch (error) {
    console.error(`Error fetching dataset with id ${id}:`, error);
    throw error;
  }
}

/**
 * Membuat dataset baru
 */
export async function createDataset(dataset: Omit<Dataset, 'id' | 'created_at' | 'updated_at'>) {
  try {
    console.log('Creating dataset in Supabase:', {
      name: dataset.name,
      category: dataset.category,
      source: dataset.source,
      description_length: dataset.description?.length,
      variables_length: dataset.variables?.length,
      content_length: dataset.content?.length
    });

    // Format data untuk database
    const dbDataset = {
      name: dataset.name,
      category: dataset.category,
      source: dataset.source,
      description: dataset.description || '',
      content: Array.isArray(dataset.content) ? dataset.content : [],
      variables: Array.isArray(dataset.variables) ? dataset.variables : []
    };

    // Verifikasi data sebelum dikirim ke Supabase
    console.log('Verifikasi struktur content:',
      Array.isArray(dbDataset.content) ? 'Array valid' : `Bukan array: ${typeof dbDataset.content}`);
    console.log('Verifikasi struktur variables:',
      Array.isArray(dbDataset.variables) ? 'Array valid' : `Bukan array: ${typeof dbDataset.variables}`);

    // Periksa ukuran data
    const contentSize = JSON.stringify(dbDataset.content).length;
    if (contentSize > 10000000) { // 10MB limit
      throw new Error(`Ukuran dataset terlalu besar: ${Math.round(contentSize/1024/1024)}MB. Maksimum 10MB.`);
    }

    // Gunakan supabaseAdmin jika tersedia untuk bypass RLS, jika tidak gunakan supabase normal
    const client = supabaseAdmin || supabase;

    console.log('Using admin client:', !!supabaseAdmin);

    const { data, error } = await client
      .from('datasets')
      .insert([dbDataset])
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }

    return formatDatasetFromDb(data);
  } catch (error) {
    console.error('Error creating dataset:', error);
    throw error;
  }
}

/**
 * Memperbarui dataset yang sudah ada
 */
export async function updateDataset(id: string, dataset: Partial<Dataset>) {
  try {
    // Format data untuk database
    const dbDataset: any = {};
    if (dataset.name) dbDataset.name = dataset.name;
    if (dataset.category) dbDataset.category = dataset.category;
    if (dataset.source) dbDataset.source = dataset.source;
    if (dataset.description) dbDataset.description = dataset.description;
    if (dataset.content) dbDataset.content = dataset.content;
    if (dataset.variables) dbDataset.variables = dataset.variables;

    // Gunakan supabaseAdmin jika tersedia untuk bypass RLS, jika tidak gunakan supabase normal
    const client = supabaseAdmin || supabase;

    const { data, error } = await client
      .from('datasets')
      .update(dbDataset)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return formatDatasetFromDb(data);
  } catch (error) {
    console.error(`Error updating dataset with id ${id}:`, error);
    throw error;
  }
}

/**
 * Menghapus dataset
 */
export async function deleteDataset(id: string) {
  try {
    // Gunakan supabaseAdmin jika tersedia untuk bypass RLS, jika tidak gunakan supabase normal
    const client = supabaseAdmin || supabase;

    const { error } = await client
      .from('datasets')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error(`Error deleting dataset with id ${id}:`, error);
    throw error;
  }
}

/**
 * Helper function untuk format dataset dari database
 */
function formatDatasetFromDb(dbDataset: any): Dataset {
  return {
    id: dbDataset.id,
    name: dbDataset.name,
    category: dbDataset.category,
    source: dbDataset.source,
    description: dbDataset.description,
    content: dbDataset.content || [],
    variables: dbDataset.variables || [],
    created_at: dbDataset.created_at,
    updated_at: dbDataset.updated_at,
  };
}
