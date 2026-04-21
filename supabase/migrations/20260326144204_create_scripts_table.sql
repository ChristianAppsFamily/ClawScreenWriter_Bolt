/*
  # Create Scripts Table

  1. New Tables
    - `scripts`
      - `id` (uuid, primary key) - Unique identifier for each script
      - `user_id` (uuid, foreign key) - References auth.users, owner of the script
      - `title` (text) - Title of the screenplay
      - `content` (text) - The screenplay content
      - `created_at` (timestamptz) - When the script was created
      - `updated_at` (timestamptz) - When the script was last modified

  2. Security
    - Enable RLS on `scripts` table
    - Add policy for users to read their own scripts
    - Add policy for users to insert their own scripts
    - Add policy for users to update their own scripts
    - Add policy for users to delete their own scripts
*/

CREATE TABLE IF NOT EXISTS scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Script',
  content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS scripts_user_id_idx ON scripts(user_id);

-- Enable Row Level Security
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own scripts
CREATE POLICY "Users can view own scripts"
  ON scripts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own scripts
CREATE POLICY "Users can insert own scripts"
  ON scripts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own scripts
CREATE POLICY "Users can update own scripts"
  ON scripts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own scripts
CREATE POLICY "Users can delete own scripts"
  ON scripts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_scripts_updated_at
  BEFORE UPDATE ON scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();