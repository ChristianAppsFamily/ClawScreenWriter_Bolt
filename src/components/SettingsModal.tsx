import { X, Sun, Moon, Monitor, LogOut, Mail, CreditCard, HelpCircle, FileText, FileType, File, FileDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ExportFormat } from '../lib/export';

interface SettingsModalProps {
  onClose: () => void;
  onExport?: (format: ExportFormat) => void;
  hasActiveScript?: boolean;
}

const exportOptions: { format: ExportFormat; label: string; description: string; icon: typeof FileDown; color: string }[] = [
  { format: 'pdf', label: 'Export as PDF', description: 'Print-ready screenplay document', icon: FileDown, color: 'text-red-500' },
  { format: 'fountain', label: 'Export as Fountain', description: 'Plain text screenplay format (.fountain)', icon: FileText, color: 'text-green-500' },
  { format: 'fdx', label: 'Export as Final Draft', description: 'Compatible with Final Draft software (.fdx)', icon: FileType, color: 'text-blue-500' },
  { format: 'txt', label: 'Export as Plain Text', description: 'Simple text file (.txt)', icon: File, color: 'text-gray-500' },
];

export default function SettingsModal({ onClose, onExport, hasActiveScript }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleExport = (format: ExportFormat) => {
    if (onExport) {
      onExport(format);
      onClose();
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4 text-gray-400" />
              Theme
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    theme === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      theme === value ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      theme === value
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              Account
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              Billing
            </h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Free Plan</span>
                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Unlimited scripts, full Fountain editor access
              </p>
              <button className="w-full px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                Upgrade to Pro
              </button>
            </div>
          </div>

          {hasActiveScript && onExport && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileDown className="w-4 h-4 text-gray-400" />
                Export Script
              </h3>
              <div className="space-y-2">
                {exportOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.format}
                      onClick={() => handleExport(option.format)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Icon className={`w-5 h-5 ${option.color}`} />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              Support
            </h3>
            <div className="space-y-2">
              <a
                href="mailto:support@openclaw.ai"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">Contact Support</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Get help with any issues</p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">Help Center</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Guides and documentation</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            OpenClaw v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
