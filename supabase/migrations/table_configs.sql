-- Table untuk menyimpan konfigurasi tabel dinamis
-- Satu dataset dapat memiliki banyak konfigurasi tabel
CREATE TABLE IF NOT EXISTS table_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  title_field TEXT NOT NULL,
  row_field TEXT NOT NULL,
  characteristic_fields JSONB NOT NULL,
  aggregation_method TEXT NOT NULL DEFAULT 'sum' CHECK (aggregation_method IN ('sum', 'count', 'average')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indeks untuk mempercepat pencarian
CREATE INDEX IF NOT EXISTS table_configs_dataset_id_idx ON table_configs(dataset_id);
CREATE INDEX IF NOT EXISTS table_configs_title_idx ON table_configs(title);

-- Trigger untuk mengupdate kolom updated_at saat data diperbarui
CREATE OR REPLACE FUNCTION update_table_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_table_configs_updated_at
BEFORE UPDATE ON table_configs
FOR EACH ROW
EXECUTE FUNCTION update_table_configs_updated_at();

-- RLS (Row Level Security) untuk tabel table_configs
ALTER TABLE table_configs ENABLE ROW LEVEL SECURITY;

-- Policy untuk mengizinkan semua operasi pada pengguna yang autentikasi
CREATE POLICY "Authenticated users can perform all operations on table_configs" ON table_configs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy untuk mengizinkan semua pengguna melihat tabel yang aktif
CREATE POLICY "Everyone can view active table_configs" ON table_configs
FOR SELECT
TO anon
USING (is_active = true);

-- Tambahkan beberapa kolom tambahan untuk penyesuaian tampilan tabel
ALTER TABLE table_configs ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE table_configs ADD COLUMN IF NOT EXISTS layout_config JSONB DEFAULT '{}';
ALTER TABLE table_configs ADD COLUMN IF NOT EXISTS filter_config JSONB DEFAULT '{}';
ALTER TABLE table_configs ADD COLUMN IF NOT EXISTS visualization_config JSONB DEFAULT '{}';
