'use client';

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">⌨️ Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-4">
          {/* Quiz Navigation */}
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Quiz Navigation</h3>
            <div className="space-y-2">
              <ShortcutRow keys={['1', '2', '3', '4']} description="Select answer option" />
              <ShortcutRow keys={['Enter']} description="Submit answer" />
              <ShortcutRow keys={['N', '→']} description="Next question" />
              <ShortcutRow keys={['←']} description="Previous question" />
              <ShortcutRow keys={['H']} description="Show/hide hint" />
            </div>
          </div>

          {/* General */}
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">General</h3>
            <div className="space-y-2">
              <ShortcutRow keys={['?']} description="Show this help" />
              <ShortcutRow keys={['Esc']} description="Close modal" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, description }: { keys: string[], description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 dark:text-gray-400">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, index) => (
          <span key={index}>
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="text-gray-400 dark:text-gray-500 mx-1">or</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
