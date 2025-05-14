-- Migrasi untuk tabel infografis dan kebijakan keamanannya
-- Dibuat pada: 2023-07-01

-- Aktifkan ekstensi untuk pencarian teks
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Buat tabel infografis
CREATE TABLE IF NOT EXISTS infografis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  data_source TEXT,
  image_url TEXT NOT NULL,
  image_width INTEGER,
  image_height INTEGER,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ
);

-- Tambahkan indeks untuk pencarian
CREATE INDEX IF NOT EXISTS infografis_title_idx ON infografis USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS infografis_category_idx ON infografis(category);
CREATE INDEX IF NOT EXISTS infografis_tags_idx ON infografis USING gin(tags);

-- Fungsi trigger untuk mengupdate timestamp
CREATE OR REPLACE FUNCTION update_infografis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Buat trigger untuk mengupdate timestamp
CREATE TRIGGER update_infografis_updated_at
BEFORE UPDATE ON infografis
FOR EACH ROW
EXECUTE FUNCTION update_infografis_updated_at();

-- Kebijakan RLS (Row Level Security) untuk tabel infografis
ALTER TABLE infografis ENABLE ROW LEVEL SECURITY;

-- Semua pengguna dapat melihat infografis yang dipublikasikan
CREATE POLICY "Infografis yang dipublikasikan dapat dilihat oleh semua pengguna"
  ON infografis
  FOR SELECT
  USING (published = true);

-- Admin dapat melihat semua infografis
CREATE POLICY "Admin dapat melihat semua infografis"
  ON infografis
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  ));

-- Admin dapat membuat infografis baru
CREATE POLICY "Admin dapat membuat infografis"
  ON infografis
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  ));

-- Admin dapat mengupdate infografis
CREATE POLICY "Admin dapat mengupdate infografis"
  ON infografis
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  ));

-- Admin dapat menghapus infografis
CREATE POLICY "Admin dapat menghapus infografis"
  ON infografis
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  ));

-- Izinkan penyimpanan di bucket infografis
INSERT INTO storage.buckets (id, name, public)
VALUES ('infografis', 'infografis', true)
ON CONFLICT (id) DO NOTHING;

-- Fungsi untuk validasi aspek rasio 9:16
CREATE OR REPLACE FUNCTION validate_image_aspect_ratio()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika aspek rasio tidak mendekati 9:16 (0.5625)
  IF NEW.image_width > 0 AND NEW.image_height > 0 THEN
    -- Toleransi 5% untuk aspek rasio
    IF ABS((NEW.image_width::float / NEW.image_height::float) - 0.5625) > 0.03 THEN
      RAISE EXCEPTION 'Gambar harus memiliki aspek rasio 9:16';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Buat trigger untuk validasi aspek rasio
CREATE TRIGGER validate_infografis_image_ratio
BEFORE INSERT OR UPDATE ON infografis
FOR EACH ROW
EXECUTE FUNCTION validate_image_aspect_ratio();

-- Kebijakan RLS untuk bucket infografis
CREATE POLICY "Publik dapat melihat infografis"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'infografis');

-- Admin dapat upload infografis
CREATE POLICY "Admin dapat mengupload infografis"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'infografis' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Admin dapat mengupdate file infografis
CREATE POLICY "Admin dapat mengupdate file infografis"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'infografis' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Admin dapat menghapus file infografis
CREATE POLICY "Admin dapat menghapus file infografis"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'infografis' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );
