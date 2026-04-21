/*
  # Add Script Metadata and Sections

  1. Modified Tables
    - `scripts`
      - `written_by` (text) - "Written By" credit line
      - `author_name` (text) - Author's name
      - `contact_info` (text) - Contact information
      - `draft_date` (date) - Date of the draft

  2. New Tables
    - `story_steps`
      - `id` (uuid, primary key) - Unique identifier
      - `script_id` (uuid, foreign key) - References scripts table
      - `title` (text) - Step title
      - `content` (text) - Step content
      - `order_index` (integer) - Order of the step
      - `created_at` (timestamptz) - When created
      - `updated_at` (timestamptz) - When last modified

    - `script_drafts`
      - `id` (uuid, primary key) - Unique identifier
      - `script_id` (uuid, foreign key) - References scripts table
      - `title` (text) - Draft title
      - `content` (text) - Draft content
      - `order_index` (integer) - Order of the draft
      - `created_at` (timestamptz) - When created
      - `updated_at` (timestamptz) - When last modified

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users to manage their own data
*/

-- Add new columns to scripts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scripts' AND column_name = 'written_by'
  ) THEN
    ALTER TABLE scripts ADD COLUMN written_by text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scripts' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE scripts ADD COLUMN author_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scripts' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE scripts ADD COLUMN contact_info text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scripts' AND column_name = 'draft_date'
  ) THEN
    ALTER TABLE scripts ADD COLUMN draft_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Create story_steps table
CREATE TABLE IF NOT EXISTS story_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Step',
  content text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS story_steps_script_id_idx ON story_steps(script_id);

ALTER TABLE story_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own story steps"
  ON story_steps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = story_steps.script_id
      AND scripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own story steps"
  ON story_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = story_steps.script_id
      AND scripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own story steps"
  ON story_steps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = story_steps.script_id
      AND scripts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = story_steps.script_id
      AND scripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own story steps"
  ON story_steps
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = story_steps.script_id
      AND scripts.user_id = auth.uid()
    )
  );

-- Create script_drafts table
CREATE TABLE IF NOT EXISTS script_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Draft 1',
  content text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS script_drafts_script_id_idx ON script_drafts(script_id);

ALTER TABLE script_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own script drafts"
  ON script_drafts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = script_drafts.script_id
      AND scripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own script drafts"
  ON script_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = script_drafts.script_id
      AND scripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own script drafts"
  ON script_drafts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = script_drafts.script_id
      AND scripts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = script_drafts.script_id
      AND scripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own script drafts"
  ON script_drafts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scripts
      WHERE scripts.id = script_drafts.script_id
      AND scripts.user_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_story_steps_updated_at
  BEFORE UPDATE ON story_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_script_drafts_updated_at
  BEFORE UPDATE ON script_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();