import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { ScriptDraft } from '../lib/supabase';
import FountainEditor from './FountainEditor';

interface DraftEditorProps {
  draft: ScriptDraft;
  onUpdate: (updates: Partial<Pick<ScriptDraft, 'title' | 'content'>>) => void;
  onDelete: () => void;
}

export default function DraftEditor({ draft, onUpdate, onDelete }: DraftEditorProps) {
  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(draft.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(draft.title);
    setContent(draft.content);
    setRenameValue(draft.title);
  }, [draft.id, draft.title, draft.content]);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (updates: Partial<Pick<ScriptDraft, 'title' | 'content'>>) => {
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

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-3">
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
                  className="flex-1 text-lg font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-primary-500"
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
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
                  Fountain
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
      <div className="flex-1 overflow-hidden">
        <FountainEditor
          value={content}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}
