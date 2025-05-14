-- Create datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  source VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB NOT NULL,
  variables JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for category for faster searches
CREATE INDEX IF NOT EXISTS datasets_category_idx ON datasets(category);

-- Add RLS (Row Level Security) policies
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- Policy for admin users to manage all datasets
CREATE POLICY "Admins can do all operations on datasets"
  ON datasets
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Policy for all users to view datasets
CREATE POLICY "All users can view datasets"
  ON datasets
  FOR SELECT
  USING (true);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_datasets_updated_at
BEFORE UPDATE ON datasets
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();
