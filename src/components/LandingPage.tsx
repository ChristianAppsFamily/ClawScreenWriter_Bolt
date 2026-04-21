import { useState } from 'react';
import { Feather } from 'lucide-react';
import AuthModal from './AuthModal';

export default function LandingPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Feather className="w-6 h-6 text-primary-500" />
          <span className="text-xl font-semibold text-gray-900 dark:text-white">ClawScreenwriter</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAuthMode('signin')}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => setAuthMode('signup')}
            className="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
              <Feather className="w-16 h-16 text-primary-500" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            ClawScreenwriter
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Write your next screenplay with a clean, focused writing experience.
            No distractions. Just you and your story.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setAuthMode('signin')}
              className="px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className="px-6 py-3 text-base font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
        Write better screenplays, faster.
      </footer>

      {authMode && (
        <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitch={(mode) => setAuthMode(mode)} />
      )}
    </div>
  );
}
