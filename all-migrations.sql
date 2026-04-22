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
  EXECUTE FUNCTION update_updated_at_column();/*
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
  EXECUTE FUNCTION update_updated_at_column();/*
  # Add Step Type to Story Steps

  1. Modified Tables
    - `story_steps`
      - `step_type` (text) - The type of story development step (logline, synopsis, etc.)

  2. Description
    - Adds a step_type column to categorize story development steps
    - Valid types: title, logline, tagline, genre, format, characters, 
      brief_summary, synopsis, treatment, outline, beat_sheet
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'story_steps' AND column_name = 'step_type'
  ) THEN
    ALTER TABLE story_steps ADD COLUMN step_type text DEFAULT 'custom';
  END IF;
END $$;/*
  # Add writers array to scripts table

  ## Changes
  - Adds a `writers` column to the `scripts` table as a text array
  - Stores up to 4 writer names per script
  - Defaults to empty array

  ## Notes
  - The existing `author_name` column is preserved for backwards compatibility
  - New `writers` column replaces the author_name field in the UI
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scripts' AND column_name = 'writers'
  ) THEN
    ALTER TABLE scripts ADD COLUMN writers text[] DEFAULT '{}';
  END IF;
END $$;
