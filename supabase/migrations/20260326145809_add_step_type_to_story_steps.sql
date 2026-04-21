/*
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
END $$;