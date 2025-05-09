import { supabase } from '@/lib/supabase';

/**
 * Script untuk memigrasikan konfigurasi tabel dari struktur lama (disimpan dalam dataset)
 * ke struktur baru (disimpan dalam tabel table_configs)
 *
 * Cara penggunaan:
 * 1. Buka konsol browser di aplikasi
 * 2. Import dan panggil fungsi ini:
 *    import { migrateTableConfigs } from '@/migrations/migrate_table_configs';
 *    await migrateTableConfigs();
 */
export async function migrateTableConfigs() {
  console.log('Starting migration of table configs...');

  try {
    // Ambil semua dataset
    const { data: datasets, error: datasetError } = await supabase
      .from('datasets')
      .select('*');

    if (datasetError) {
      throw datasetError;
    }

    console.log(`Found ${datasets.length} datasets to check for table configs`);

    let migratedCount = 0;
    let skippedCount = 0;

    // Untuk setiap dataset, periksa apakah ada konfigurasi tabel lama
    for (const dataset of datasets) {
      if (!dataset.tableConfigs && !dataset.tableConfig) {
        console.log(`Dataset ${dataset.id} (${dataset.name}) has no table configs to migrate. Skipping.`);
        skippedCount++;
        continue;
      }

      const configs = dataset.tableConfigs || (dataset.tableConfig ? [dataset.tableConfig] : []);

      console.log(`Dataset ${dataset.id} (${dataset.name}) has ${configs.length} table configs to migrate`);

      // Untuk setiap konfigurasi, buat konfigurasi baru di tabel_configs
      for (const config of configs) {
        // Periksa apakah konfigurasi sudah valid
        if (!config.titleField || !config.rowField || !Array.isArray(config.characteristicFields)) {
          console.warn(`Dataset ${dataset.id} (${dataset.name}) has invalid config. Skipping.`);
          skippedCount++;
          continue;
        }

        // Format data untuk tabel baru
        const newConfig = {
          dataset_id: dataset.id,
          title: config.titleField,
          description: dataset.description || '',
          title_field: config.titleField,
          row_field: config.rowField,
          characteristic_fields: config.characteristicFields,
          aggregation_method: config.aggregationMethod || 'sum',
          is_active: true,
          display_order: 0
        };

        // Cek apakah konfigurasi sudah ada di tabel baru
        const { data: existingConfigs, error: existingError } = await supabase
          .from('table_configs')
          .select('*')
          .eq('dataset_id', dataset.id)
          .eq('title_field', config.titleField)
          .eq('row_field', config.rowField);

        if (existingError) {
          console.error(`Error checking existing configs for dataset ${dataset.id}:`, existingError);
          continue;
        }

        if (existingConfigs && existingConfigs.length > 0) {
          console.log(`Config already exists for dataset ${dataset.id} (${dataset.name}). Skipping.`);
          skippedCount++;
          continue;
        }

        // Simpan konfigurasi ke tabel baru
        const { data: insertedConfig, error: insertError } = await supabase
          .from('table_configs')
          .insert([newConfig])
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting config for dataset ${dataset.id}:`, insertError);
          continue;
        }

        console.log(`Migrated config for dataset ${dataset.id} (${dataset.name}). New config ID: ${insertedConfig.id}`);
        migratedCount++;
      }
    }

    console.log(`Migration completed. Migrated ${migratedCount} configs, skipped ${skippedCount} configs.`);
    return { migratedCount, skippedCount };
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}
