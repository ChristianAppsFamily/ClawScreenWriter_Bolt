import { useState, useEffect, useCallback } from 'react';
import { supabase, Script, StoryStep, ScriptDraft, StepType } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useScripts() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScripts = useCallback(async () => {
    if (!user) {
      setScripts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setScripts(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  const createScript = async (scriptData: Partial<Script> = {}) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        title: scriptData.title || 'Untitled Script',
        content: scriptData.content || '',
        written_by: scriptData.written_by || '',
        author_name: scriptData.author_name || '',
        writers: scriptData.writers || [],
        contact_info: scriptData.contact_info || '',
        draft_date: scriptData.draft_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setScripts(prev => [data, ...prev]);
    return data;
  };

  const updateScript = async (id: string, updates: Partial<Script>) => {
    const { data, error } = await supabase
      .from('scripts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setScripts(prev => prev.map(s => s.id === id ? data : s));
    return data;
  };

  const deleteScript = async (id: string) => {
    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    setScripts(prev => prev.filter(s => s.id !== id));
    return true;
  };

  return {
    scripts,
    loading,
    error,
    createScript,
    updateScript,
    deleteScript,
    refetch: fetchScripts,
  };
}

export function useStorySteps(scriptId: string | null) {
  const [steps, setSteps] = useState<StoryStep[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSteps = useCallback(async () => {
    if (!scriptId) {
      setSteps([]);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from('story_steps')
      .select('*')
      .eq('script_id', scriptId)
      .order('order_index', { ascending: true });

    setSteps(data || []);
    setLoading(false);
  }, [scriptId]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const createStep = async (stepType: StepType, title: string) => {
    if (!scriptId) return null;

    const maxOrder = steps.length > 0 ? Math.max(...steps.map(s => s.order_index)) + 1 : 0;

    const { data, error } = await supabase
      .from('story_steps')
      .insert({ script_id: scriptId, title, step_type: stepType, order_index: maxOrder })
      .select()
      .single();

    if (error) return null;

    setSteps(prev => [...prev, data]);
    return data;
  };

  const updateStep = async (id: string, updates: Partial<StoryStep>) => {
    const { data, error } = await supabase
      .from('story_steps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;

    setSteps(prev => prev.map(s => s.id === id ? data : s));
    return data;
  };

  const deleteStep = async (id: string) => {
    const { error } = await supabase
      .from('story_steps')
      .delete()
      .eq('id', id);

    if (error) return false;

    setSteps(prev => prev.filter(s => s.id !== id));
    return true;
  };

  return { steps, loading, createStep, updateStep, deleteStep, refetch: fetchSteps };
}

export function useScriptDrafts(scriptId: string | null) {
  const [drafts, setDrafts] = useState<ScriptDraft[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDrafts = useCallback(async () => {
    if (!scriptId) {
      setDrafts([]);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from('script_drafts')
      .select('*')
      .eq('script_id', scriptId)
      .order('order_index', { ascending: true });

    setDrafts(data || []);
    setLoading(false);
  }, [scriptId]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const createDraft = async (title?: string) => {
    if (!scriptId) return null;

    const maxOrder = drafts.length > 0 ? Math.max(...drafts.map(d => d.order_index)) + 1 : 0;
    const draftTitle = title || `Draft ${drafts.length + 1}`;

    const { data, error } = await supabase
      .from('script_drafts')
      .insert({ script_id: scriptId, title: draftTitle, order_index: maxOrder })
      .select()
      .single();

    if (error) return null;

    setDrafts(prev => [...prev, data]);
    return data;
  };

  const updateDraft = async (id: string, updates: Partial<ScriptDraft>) => {
    const { data, error } = await supabase
      .from('script_drafts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return null;

    setDrafts(prev => prev.map(d => d.id === id ? data : d));
    return data;
  };

  const deleteDraft = async (id: string) => {
    const { error } = await supabase
      .from('script_drafts')
      .delete()
      .eq('id', id);

    if (error) return false;

    setDrafts(prev => prev.filter(d => d.id !== id));
    return true;
  };

  return { drafts, loading, createDraft, updateDraft, deleteDraft, refetch: fetchDrafts };
}
