'use client';

import { useState, useEffect } from 'react';
import Portal from './Portal';

export default function DecommissionBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  if (!visible) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center relative animate-in fade-in">
          <div className="text-5xl mb-4">
            <span role="img" aria-label="heart">💛</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Thank You, Kwizme Fam
          </h2>

          <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
            <p>
              It&apos;s been an incredible journey building Kwizme and watching so
              many of you use it to study, learn, and crush your exams. Every
              quiz generated, every score celebrated — that was all you.
            </p>

            <p>
              Kwizme will be <strong className="text-red-500 dark:text-red-400">shutting down on May 17, 2026</strong>.
              We know change is hard, and we&apos;re grateful for every moment
              you spent here.
            </p>

            <p>
              But this isn&apos;t really goodbye — Kwizme is going{' '}
              <strong className="text-green-600 dark:text-green-400">open source</strong>!
              If you&apos;d like to keep using it, you can run your own server:
            </p>

            <a
              href="https://github.com/mhonnczedz2/kwizme.git"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400 font-mono text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors break-all"
            >
              github.com/mhonnczedz2/kwizme
            </a>

            <p className="italic text-gray-500 dark:text-gray-400">
              Good luck on your studies — we&apos;re rooting for you, always.
            </p>
          </div>

          <button
            onClick={() => setVisible(false)}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Got it, thank you!
          </button>
        </div>
      </div>
    </Portal>
  );
}
