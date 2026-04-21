import {
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  BookOpen,
  Lightbulb,
  PenTool,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Script, StoryStep, ScriptDraft, StepType, STEP_TYPES } from '../lib/supabase';

export type ActiveView =
  | { type: 'welcome' }
  | { type: 'new-script' }
  | { type: 'title-page'; scriptId: string }
  | { type: 'story-step'; scriptId: string; stepId: string }
  | { type: 'draft'; scriptId: string; draftId: string };

interface SidebarProps {
  scripts: Script[];
  storySteps: StoryStep[];
  scriptDrafts: ScriptDraft[];
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  onCreateScript: () => void;
  onDeleteScript: (id: string) => void;
  onCreateStep: (stepType: StepType, title: string) => void;
  onDeleteStep: (id: string) => void;
  onCreateDraft: () => void;
  onDeleteDraft: (id: string) => void;
  loading: boolean;
}

function StepTypeDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (stepType: StepType, title: string) => void;
  onClose: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto"
    >
      {STEP_TYPES.map((type) => (
        <button
          key={type.value}
          onClick={() => {
            onSelect(type.value, type.label);
            onClose();
          }}
          className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}

export default function Sidebar({
  scripts,
  storySteps,
  scriptDrafts,
  activeView,
  onChangeView,
  onCreateScript,
  onDeleteScript,
  onCreateStep,
  onDeleteStep,
  onCreateDraft,
  onDeleteDraft,
  loading,
}: SidebarProps) {
  const [isScriptsExpanded, setIsScriptsExpanded] = useState(true);
  const [expandedScripts, setExpandedScripts] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Record<string, { story: boolean; scripting: boolean }>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showStepDropdown, setShowStepDropdown] = useState<string | null>(null);

  const toggleScript = (scriptId: string) => {
    setExpandedScripts((prev) => {
      const next = new Set(prev);
      if (next.has(scriptId)) {
        next.delete(scriptId);
      } else {
        next.add(scriptId);
      }
      return next;
    });
  };

  const toggleSection = (scriptId: string, section: 'story' | 'scripting') => {
    setExpandedSections((prev) => ({
      ...prev,
      [scriptId]: {
        story: prev[scriptId]?.story ?? false,
        scripting: prev[scriptId]?.scripting ?? false,
        [section]: !(prev[scriptId]?.[section] ?? false),
      },
    }));
  };

  const getActiveScriptId = () => {
    if (activeView.type === 'title-page' || activeView.type === 'story-step' || activeView.type === 'draft') {
      return activeView.scriptId;
    }
    return null;
  };

  const activeScriptId = getActiveScriptId();

  return (
    <aside className="w-64 h-full bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-800 flex flex-col">
      <div className="p-3">
        <button
          onClick={onCreateScript}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Script
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <div>
          <button
            onClick={() => setIsScriptsExpanded(!isScriptsExpanded)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isScriptsExpanded ? '' : '-rotate-90'}`}
            />
            Scripts
          </button>

          {isScriptsExpanded && (
            <div className="mt-1 space-y-0.5">
              {loading ? (
                <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">Loading...</div>
              ) : scripts.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No scripts yet</div>
              ) : (
                scripts.map((script) => {
                  const isExpanded = expandedScripts.has(script.id);
                  const isActive = activeScriptId === script.id;
                  const sections = expandedSections[script.id] || { story: false, scripting: false };
                  const scriptSteps = storySteps.filter((s) => s.script_id === script.id);
                  const scriptDraftsFiltered = scriptDrafts.filter((d) => d.script_id === script.id);

                  return (
                    <div key={script.id} className="relative">
                      <div
                        className="relative"
                        onMouseEnter={() => setHoveredItem(`script-${script.id}`)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <button
                          onClick={() => toggleScript(script.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors text-left ${
                            isActive
                              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate flex-1">{script.title}</span>
                        </button>
                        {hoveredItem === `script-${script.id}` && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteScript(script.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete script"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 dark:border-gray-700 pl-2">
                          <button
                            onClick={() => onChangeView({ type: 'title-page', scriptId: script.id })}
                            className={`w-full flex items-center gap-2 px-2 py-1 text-sm rounded-md transition-colors text-left ${
                              activeView.type === 'title-page' && activeView.scriptId === script.id
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Title Page</span>
                          </button>

                          <div>
                            <button
                              onClick={() => toggleSection(script.id, 'story')}
                              className="w-full flex items-center gap-2 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors"
                            >
                              {sections.story ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>Story Development</span>
                            </button>
                            {sections.story && (
                              <div className="ml-5 mt-0.5 space-y-0.5">
                                {scriptSteps.map((step) => (
                                  <div
                                    key={step.id}
                                    className="relative"
                                    onMouseEnter={() => setHoveredItem(`step-${step.id}`)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                  >
                                    <button
                                      onClick={() =>
                                        onChangeView({ type: 'story-step', scriptId: script.id, stepId: step.id })
                                      }
                                      className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-colors text-left ${
                                        activeView.type === 'story-step' && activeView.stepId === step.id
                                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                          : 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                      }`}
                                    >
                                      <span className="truncate">{step.title}</span>
                                    </button>
                                    {hoveredItem === `step-${step.id}` && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteStep(step.id);
                                        }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <div className="relative">
                                  <button
                                    onClick={() => setShowStepDropdown(showStepDropdown === script.id ? null : script.id)}
                                    className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add Step</span>
                                    <ChevronDown className="w-3 h-3 ml-auto" />
                                  </button>
                                  {showStepDropdown === script.id && (
                                    <StepTypeDropdown
                                      onSelect={(stepType, title) => onCreateStep(stepType, title)}
                                      onClose={() => setShowStepDropdown(null)}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <button
                              onClick={() => toggleSection(script.id, 'scripting')}
                              className="w-full flex items-center gap-2 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors"
                            >
                              {sections.scripting ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              <PenTool className="w-3.5 h-3.5" />
                              <span>Scripting</span>
                            </button>
                            {sections.scripting && (
                              <div className="ml-5 mt-0.5 space-y-0.5">
                                {scriptDraftsFiltered.map((draft) => (
                                  <div
                                    key={draft.id}
                                    className="relative"
                                    onMouseEnter={() => setHoveredItem(`draft-${draft.id}`)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                  >
                                    <button
                                      onClick={() =>
                                        onChangeView({ type: 'draft', scriptId: script.id, draftId: draft.id })
                                      }
                                      className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-colors text-left ${
                                        activeView.type === 'draft' && activeView.draftId === draft.id
                                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                          : 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                      }`}
                                    >
                                      <span className="truncate">{draft.title}</span>
                                    </button>
                                    {hoveredItem === `draft-${draft.id}` && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteDraft(draft.id);
                                        }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  onClick={onCreateDraft}
                                  className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Draft</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
