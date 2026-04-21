import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Script = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  written_by: string;
  author_name: string;
  writers: string[];
  contact_info: string;
  draft_date: string;
  created_at: string;
  updated_at: string;
};

export type StepType =
  | 'title'
  | 'logline'
  | 'tagline'
  | 'genre'
  | 'format'
  | 'characters'
  | 'brief_summary'
  | 'synopsis'
  | 'treatment'
  | 'outline'
  | 'beat_sheet'
  | 'custom';

export const STEP_TYPES: { value: StepType; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'logline', label: 'Logline' },
  { value: 'tagline', label: 'Tagline' },
  { value: 'genre', label: 'Genre' },
  { value: 'format', label: 'Format' },
  { value: 'characters', label: 'Characters' },
  { value: 'brief_summary', label: 'Brief Summary' },
  { value: 'synopsis', label: 'Synopsis' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'outline', label: 'Outline' },
  { value: 'beat_sheet', label: 'Beat Sheet' },
];

export type StoryStep = {
  id: string;
  script_id: string;
  title: string;
  content: string;
  step_type: StepType;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type ScriptDraft = {
  id: string;
  script_id: string;
  title: string;
  content: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};
