import { Feather, Settings } from 'lucide-react';
import { Script } from '../lib/supabase';
import { ExportFormat } from '../lib/export';
import ExportDropdown from './ExportDropdown';

interface TopBarProps {
  activeScript: Script | null;
  onOpenSettings: () => void;
  onExport: (format: ExportFormat) => void;
}

export default function TopBar({ activeScript, onOpenSettings, onExport }: TopBarProps) {
  return (
    <header className="h-14 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <Feather className="w-5 h-5 text-primary-500" />
        <span className="text-lg font-semibold text-gray-900 dark:text-white">ClawScreenwriter</span>
        {activeScript && (
          <>
            <span className="text-gray-300 dark:text-gray-600 mx-2">/</span>
            <span className="text-gray-600 dark:text-gray-400 text-sm truncate max-w-[200px]">
              {activeScript.title}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ExportDropdown
          disabled={!activeScript}
          onExport={onExport}
        />
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
