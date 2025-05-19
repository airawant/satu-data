import { supabase, supabaseAdmin } from '@/lib/supabase';

export type TableConfigFields = {
  title_field: string;
  row_field: string;
  characteristic_fields: string[];
};

export type TableConfig = {
  id?: string;
  dataset_id: string;
  title: string;
  description?: string;
  title_field: string;
  row_field: string;
  characteristic_fields: string[];
  aggregation_method: 'sum' | 'count' | 'average';
  is_active?: boolean;
  display_order?: number;
  layout_config?: Record<string, any>;
  filter_config?: Record<string, any>;
  visualization_config?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

/**
 * Mendapatkan semua konfigurasi tabel
 */
export async function getAllTableConfigs() {
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('table_configs')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(formatTableConfigFromDb);
  } catch (error) {
    console.error('Error fetching table configs:', error);
    throw error;
  }
}

/**
 * Mendapatkan konfigurasi tabel berdasarkan ID
 */
export async function getTableConfigById(id: string) {
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('table_configs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return formatTableConfigFromDb(data);
  } catch (error) {
    console.error(`Error fetching table config with id ${id}:`, error);
    throw error;
  }
}

/**
 * Mendapatkan semua konfigurasi tabel untuk dataset tertentu
 */
export async function getTableConfigsByDatasetId(datasetId: string) {
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('table_configs')
      .select('*')
      .eq('dataset_id', datasetId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(formatTableConfigFromDb);
  } catch (error) {
    console.error(`Error fetching table configs for dataset ${datasetId}:`, error);
    throw error;
  }
}

/**
 * Membuat konfigurasi tabel baru
 */
export async function createTableConfig(config: Omit<TableConfig, 'id' | 'created_at' | 'updated_at'>) {
  try {
    console.log('Creating table config:', {
      title: config.title,
      dataset_id: config.dataset_id,
      fields: config.characteristic_fields?.length
    });

    // Format data untuk database
    const dbConfig = {
      dataset_id: config.dataset_id,
      title: config.title,
      description: config.description || '',
      title_field: config.title_field,
      row_field: config.row_field,
      characteristic_fields: Array.isArray(config.characteristic_fields) ? config.characteristic_fields : [],
      aggregation_method: config.aggregation_method || 'sum',
      is_active: config.is_active !== false,
      display_order: config.display_order || 0,
      layout_config: config.layout_config || {},
      filter_config: config.filter_config || {},
      visualization_config: config.visualization_config || {}
    };

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('table_configs')
      .insert([dbConfig])
      .select()
      .single();

    if (error) {
      console.error('Error creating table config:', error);
      throw error;
    }

    return formatTableConfigFromDb(data);
  } catch (error) {
    console.error('Error creating table config:', error);
    throw error;
  }
}

/**
 * Memperbarui konfigurasi tabel yang sudah ada
 */
export async function updateTableConfig(id: string, config: Partial<TableConfig>) {
  try {
    // Format data untuk database
    const dbConfig: any = {};
    if (config.title !== undefined) dbConfig.title = config.title;
    if (config.description !== undefined) dbConfig.description = config.description;
    if (config.title_field !== undefined) dbConfig.title_field = config.title_field;
    if (config.row_field !== undefined) dbConfig.row_field = config.row_field;
    if (config.characteristic_fields !== undefined) dbConfig.characteristic_fields = config.characteristic_fields;
    if (config.aggregation_method !== undefined) dbConfig.aggregation_method = config.aggregation_method;
    if (config.is_active !== undefined) dbConfig.is_active = config.is_active;
    if (config.display_order !== undefined) dbConfig.display_order = config.display_order;
    if (config.layout_config !== undefined) dbConfig.layout_config = config.layout_config;
    if (config.filter_config !== undefined) dbConfig.filter_config = config.filter_config;
    if (config.visualization_config !== undefined) dbConfig.visualization_config = config.visualization_config;

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('table_configs')
      .update(dbConfig)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return formatTableConfigFromDb(data);
  } catch (error) {
    console.error(`Error updating table config with id ${id}:`, error);
    throw error;
  }
}

/**
 * Menghapus konfigurasi tabel
 */
export async function deleteTableConfig(id: string) {
  try {
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('table_configs')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error(`Error deleting table config with id ${id}:`, error);
    throw error;
  }
}

/**
 * Helper function untuk format konfigurasi tabel dari database
 */
function formatTableConfigFromDb(dbConfig: any): TableConfig {
  return {
    id: dbConfig.id,
    dataset_id: dbConfig.dataset_id,
    title: dbConfig.title,
    description: dbConfig.description || '',
    title_field: dbConfig.title_field,
    row_field: dbConfig.row_field,
    characteristic_fields: dbConfig.characteristic_fields || [],
    aggregation_method: dbConfig.aggregation_method || 'sum',
    is_active: dbConfig.is_active !== false,
    display_order: dbConfig.display_order || 0,
    layout_config: dbConfig.layout_config || {},
    filter_config: dbConfig.filter_config || {},
    visualization_config: dbConfig.visualization_config || {},
    created_at: dbConfig.created_at,
    updated_at: dbConfig.updated_at
  };
}
