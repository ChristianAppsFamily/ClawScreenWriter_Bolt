import { useState, useEffect } from 'react';
import { Feather, Plus, FileText, Calendar } from 'lucide-react';
import TopBar from './TopBar';
import Sidebar, { ActiveView } from './Sidebar';
import SettingsModal from './SettingsModal';
import TitlePageForm from './TitlePageForm';
import StepEditor from './StepEditor';
import DraftEditor from './DraftEditor';
import { useScripts, useStorySteps, useScriptDrafts } from '../hooks/useScripts';
import { Script, StepType } from '../lib/supabase';
import { ExportFormat, exportScript } from '../lib/export';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { scripts, loading, createScript, updateScript, deleteScript } = useScripts();
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'welcome' });
  const [showSettings, setShowSettings] = useState(false);

  const activeScriptId =
    activeView.type === 'title-page' || activeView.type === 'story-step' || activeView.type === 'draft'
      ? activeView.scriptId
      : null;

  const activeScript = scripts.find((s) => s.id === activeScriptId) || null;

  const { steps, createStep, updateStep, deleteStep } = useStorySteps(activeScriptId);
  const { drafts, createDraft, updateDraft, deleteDraft } = useScriptDrafts(activeScriptId);

  useEffect(() => {
    if (activeView.type === 'title-page' && activeScriptId) {
      const script = scripts.find((s) => s.id === activeScriptId);
      if (!script) {
        setActiveView({ type: 'welcome' });
      }
    }
  }, [scripts, activeView, activeScriptId]);

  const handleCreateScript = () => {
    setActiveView({ type: 'new-script' });
  };

  const handleSaveNewScript = async (data: {
    title: string;
    written_by: string;
    author_name: string;
    writers: string[];
    contact_info: string;
    draft_date: string;
  }) => {
    const newScript = await createScript(data);
    if (newScript) {
      const draft = await createDraftForScript(newScript.id);
      if (draft) {
        setActiveView({ type: 'draft', scriptId: newScript.id, draftId: draft.id });
      } else {
        setActiveView({ type: 'title-page', scriptId: newScript.id });
      }
    }
  };

  const handleUpdateTitlePage = async (data: {
    title: string;
    written_by: string;
    author_name: string;
    writers: string[];
    contact_info: string;
    draft_date: string;
  }) => {
    if (!activeScriptId) return;
    await updateScript(activeScriptId, data);
    const existingDraft = drafts[0];
    if (existingDraft) {
      setActiveView({ type: 'draft', scriptId: activeScriptId, draftId: existingDraft.id });
    } else {
      const draft = await createDraft();
      if (draft) {
        setActiveView({ type: 'draft', scriptId: activeScriptId, draftId: draft.id });
      }
    }
  };

  const handleDeleteScript = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this script?');
    if (confirmed) {
      await deleteScript(id);
      if (activeScriptId === id) {
        setActiveView({ type: 'welcome' });
      }
    }
  };

  const handleCreateStep = async (stepType: StepType, title: string) => {
    const step = await createStep(stepType, title);
    if (step && activeScriptId) {
      setActiveView({ type: 'story-step', scriptId: activeScriptId, stepId: step.id });
    }
  };

  const handleDeleteStep = async (id: string) => {
    const confirmed = window.confirm('Delete this step?');
    if (confirmed) {
      await deleteStep(id);
      if (activeView.type === 'story-step' && activeView.stepId === id && activeScriptId) {
        setActiveView({ type: 'title-page', scriptId: activeScriptId });
      }
    }
  };

  const handleCreateDraft = async () => {
    const draft = await createDraft();
    if (draft && activeScriptId) {
      setActiveView({ type: 'draft', scriptId: activeScriptId, draftId: draft.id });
    }
  };

  const handleDeleteDraft = async (id: string) => {
    const confirmed = window.confirm('Delete this draft?');
    if (confirmed) {
      await deleteDraft(id);
      if (activeView.type === 'draft' && activeView.draftId === id && activeScriptId) {
        setActiveView({ type: 'title-page', scriptId: activeScriptId });
      }
    }
  };

  const createDraftForScript = async (scriptId: string) => {
    const { data } = await supabase
      .from('script_drafts')
      .insert({ script_id: scriptId, title: 'Draft 1', order_index: 0 })
      .select()
      .single();
    return data;
  };

  const handleExport = (format: ExportFormat) => {
    if (!activeScript) return;
    exportScript(format, { script: activeScript, drafts });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderMainContent = () => {
    if (activeView.type === 'new-script') {
      return <TitlePageForm onSave={handleSaveNewScript} onCancel={() => setActiveView({ type: 'welcome' })} isNewScript />;
    }

    if (activeView.type === 'title-page' && activeScript) {
      return (
        <TitlePageForm
          key={activeScript.id}
          initialData={{
            title: activeScript.title,
            written_by: activeScript.written_by || '',
            author_name: activeScript.author_name || '',
            writers: activeScript.writers || [],
            contact_info: activeScript.contact_info || '',
            draft_date: activeScript.draft_date || new Date().toISOString().split('T')[0],
          }}
          onSave={handleUpdateTitlePage}
        />
      );
    }

    if (activeView.type === 'story-step') {
      const step = steps.find((s) => s.id === activeView.stepId);
      if (step) {
        return (
          <StepEditor
            key={step.id}
            step={step}
            onUpdate={(updates) => updateStep(step.id, updates)}
            onDelete={() => handleDeleteStep(step.id)}
          />
        );
      }
    }

    if (activeView.type === 'draft') {
      const draft = drafts.find((d) => d.id === activeView.draftId);
      if (draft) {
        return (
          <DraftEditor
            key={draft.id}
            draft={draft}
            onUpdate={(updates) => updateDraft(draft.id, updates)}
            onDelete={() => handleDeleteDraft(draft.id)}
          />
        );
      }
    }

    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
              <Feather className="w-12 h-12 text-primary-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Start your storytelling journey
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create a new script or select an existing one from the sidebar to begin writing.
          </p>
          <button
            onClick={handleCreateScript}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Start New Script
          </button>

          {scripts.length > 0 && (
            <div className="mt-10 w-full">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Recent Scripts
              </h3>
              <div className="space-y-2">
                {scripts.slice(0, 5).map((script) => (
                  <button
                    key={script.id}
                    onClick={() => setActiveView({ type: 'title-page', scriptId: script.id })}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                  >
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {script.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(script.updated_at)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      <TopBar
        activeScript={activeScript}
        onOpenSettings={() => setShowSettings(true)}
        onExport={handleExport}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          scripts={scripts}
          storySteps={steps}
          scriptDrafts={drafts}
          activeView={activeView}
          onChangeView={setActiveView}
          onCreateScript={handleCreateScript}
          onDeleteScript={handleDeleteScript}
          onCreateStep={handleCreateStep}
          onDeleteStep={handleDeleteStep}
          onCreateDraft={handleCreateDraft}
          onDeleteDraft={handleDeleteDraft}
          loading={loading}
        />

        <main className="flex-1 overflow-auto">{renderMainContent()}</main>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onExport={handleExport}
          hasActiveScript={!!activeScript}
        />
      )}
    </div>
  );
}
