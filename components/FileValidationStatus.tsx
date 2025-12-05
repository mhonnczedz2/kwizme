/**
 * File Validation Status Component
 * Shows validation results for uploaded files
 */

import type { FileValidationResult } from '@/lib/file-validator';

interface FileValidationStatusProps {
  validationResult: FileValidationResult | null;
  isValidating: boolean;
}

// SVG Icons
const CheckIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const ClockIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function FileValidationStatus({ validationResult, isValidating }: FileValidationStatusProps) {
  // Debug logging
  if (validationResult) {
    console.log('FileValidationStatus received:', validationResult);
  }

  if (isValidating) {
    return (
      <div className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Validating file...
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Checking page count and file integrity
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!validationResult) return null;

  const { isValid, pageCount, error, fileInfo } = validationResult;

  return (
    <div className={`mt-4 p-3 sm:p-4 border rounded-lg ${
      isValid
        ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-start space-x-3">
        {isValid ? (
          <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
        ) : (
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isValid
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {isValid
                  ? 'File ready for quiz generation'
                  : (error && error.trim() !== '' ? error : 'File validation failed - please try a different file')
                }
              </p>

              {fileInfo && (
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <span>{fileInfo.type}</span>
                  <span>{fileInfo.size}</span>
                  <span className="truncate max-w-32 sm:max-w-xs">{fileInfo.name}</span>
                  {pageCount !== undefined && (
                    <span className={`font-medium ${
                      isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {isValid && pageCount && pageCount > 1 && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Document is within the 10-page limit
            </p>
          )}
        </div>
      </div>
    </div>
  );
}