import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { StoryStep, STEP_TYPES } from '../lib/supabase';

interface StepEditorProps {
  step: StoryStep;
  onUpdate: (updates: Partial<Pick<StoryStep, 'title' | 'content'>>) => void;
  onDelete: () => void;
}

export default function StepEditor({ step, onUpdate, onDelete }: StepEditorProps) {
  const [title, setTitle] = useState(step.title);
  const [content, setContent] = useState(step.content);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(step.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(step.title);
    setContent(step.content);
    setRenameValue(step.title);
  }, [step.id, step.title, step.content]);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (updates: Partial<Pick<StoryStep, 'title' | 'content'>>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onUpdate(updates);
        }, 500);
      };
    })(),
    [onUpdate]
  );

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    debouncedUpdate({ content: newContent });
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      setTitle(renameValue.trim());
      onUpdate({ title: renameValue.trim() });
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(title);
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const stepTypeLabel = STEP_TYPES.find((t) => t.value === step.step_type)?.label || step.step_type;

  const getPlaceholder = () => {
    switch (step.step_type) {
      case 'logline':
        return 'Write a one-sentence summary of your story that captures the protagonist, conflict, and stakes...';
      case 'tagline':
        return 'Write a catchy phrase or slogan that captures the essence of your story...';
      case 'synopsis':
        return 'Write a detailed summary of your story, including major plot points and character arcs...';
      case 'treatment':
        return 'Expand your story into a prose narrative, describing scenes and character interactions...';
      case 'outline':
        return 'Create a structured breakdown of your story with acts, sequences, and scenes...';
      case 'beat_sheet':
        return 'List the key story beats and turning points in your narrative...';
      case 'characters':
        return 'Describe your main characters, their motivations, backstories, and arcs...';
      case 'genre':
        return 'Define the genre, tone, and style of your story...';
      case 'format':
        return 'Specify the format: feature film, TV pilot, short film, etc...';
      case 'brief_summary':
        return 'Write a brief overview of your story concept...';
      default:
        return 'Develop your story ideas here...';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="border-b border-gray-100 dark:border-gray-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  onBlur={handleRenameSubmit}
                  className="flex-1 text-xl font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleRenameSubmit}
                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRenameCancel}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {stepTypeLabel}
                </span>
              </div>
            )}
          </div>
          {!isRenaming && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsRenaming(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Rename"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-full px-8 py-6 text-gray-800 dark:text-gray-200 bg-transparent border-none outline-none resize-none text-base leading-relaxed placeholder-gray-400"
          placeholder={getPlaceholder()}
        />
      </div>
    </div>
  );
}
