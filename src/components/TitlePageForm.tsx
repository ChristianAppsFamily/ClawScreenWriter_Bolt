import { useState } from 'react';
import { FileText, Plus, X, ChevronDown } from 'lucide-react';

const MAX_WRITERS = 4;

interface TitlePageFormProps {
  initialData?: {
    title: string;
    written_by: string;
    author_name: string;
    writers: string[];
    contact_info: string;
    draft_date: string;
  };
  onSave: (data: {
    title: string;
    written_by: string;
    author_name: string;
    writers: string[];
    contact_info: string;
    draft_date: string;
  }) => void;
  onCancel?: () => void;
  isNewScript?: boolean;
}

export default function TitlePageForm({ initialData, onSave, onCancel, isNewScript = false }: TitlePageFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [writers, setWriters] = useState<string[]>(
    initialData?.writers?.length ? initialData.writers : ['']
  );
  const [contactInfo, setContactInfo] = useState(initialData?.contact_info || '');
  const [draftDate, setDraftDate] = useState(
    initialData?.draft_date || new Date().toISOString().split('T')[0]
  );
  const [writersOpen, setWritersOpen] = useState(false);

  const handleAddWriter = () => {
    if (writers.length < MAX_WRITERS) {
      setWriters([...writers, '']);
    }
  };

  const handleRemoveWriter = (index: number) => {
    if (writers.length === 1) {
      setWriters(['']);
    } else {
      setWriters(writers.filter((_, i) => i !== index));
    }
  };

  const handleWriterChange = (index: number, value: string) => {
    const updated = [...writers];
    updated[index] = value;
    setWriters(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredWriters = writers.filter(w => w.trim() !== '');
    const writtenBy = filteredWriters.length > 1
      ? `Written by ${filteredWriters.slice(0, -1).join(', ')} & ${filteredWriters[filteredWriters.length - 1]}`
      : filteredWriters.length === 1
        ? `Written by ${filteredWriters[0]}`
        : '';

    onSave({
      title: title.trim() || 'Untitled Script',
      written_by: writtenBy,
      author_name: filteredWriters[0] || '',
      writers: filteredWriters,
      contact_info: contactInfo,
      draft_date: draftDate,
    });
  };

  const writerCount = writers.filter(w => w.trim() !== '').length;

  return (
    <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900 p-6 overflow-auto">
      <div className="w-full max-w-lg py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isNewScript ? 'Create New Script' : 'Script Details'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isNewScript ? 'Fill in your script details to get started' : 'Edit your script information'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Script Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="My Amazing Screenplay"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Writers
                <span className="ml-2 text-xs text-gray-400 font-normal">({writerCount}/{MAX_WRITERS})</span>
              </label>
              {writers.length < MAX_WRITERS && (
                <button
                  type="button"
                  onClick={handleAddWriter}
                  className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Writer
                </button>
              )}
            </div>

            <div className="space-y-2">
              {writers.map((writer, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={writer}
                      onChange={(e) => handleWriterChange(index, e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors pr-10"
                      placeholder={index === 0 ? 'Writer name' : `Writer ${index + 1}`}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none hidden">
                    </span>
                  </div>
                  {writers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveWriter(index)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {writers.length === 1 && (
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Click "Add Writer" to add up to {MAX_WRITERS} writers
              </p>
            )}

            {writers.length > 1 && (
              <div className="mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setWritersOpen(!writersOpen)}
                  className="w-full flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
                >
                  <span>Preview title page credit</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${writersOpen ? 'rotate-180' : ''}`} />
                </button>
                {writersOpen && (
                  <p className="mt-1.5 text-xs text-gray-700 dark:text-gray-300 font-mono">
                    {writers.filter(w => w.trim()).length > 1
                      ? `Written by ${writers.filter(w => w.trim()).slice(0, -1).join(', ')} & ${writers.filter(w => w.trim()).slice(-1)[0]}`
                      : writers.filter(w => w.trim()).length === 1
                        ? `Written by ${writers.filter(w => w.trim())[0]}`
                        : 'No writers added yet'
                    }
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Contact Info
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Draft Date
            </label>
            <input
              type="date"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors mt-2 flex items-center justify-center gap-2"
          >
            {isNewScript ? 'Create Script & Start Writing' : 'Save & Go to Script'}
          </button>
          {isNewScript && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
