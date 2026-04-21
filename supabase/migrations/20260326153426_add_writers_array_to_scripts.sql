/*
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
