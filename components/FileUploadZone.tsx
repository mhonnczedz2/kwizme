'use client';

import { useState, useRef, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { validateFilePages, type FileValidationResult } from '@/lib/file-validator';
import FileValidationStatus from '@/components/FileValidationStatus';

export interface OrganizationMetadata {
  quiz_title?: string;
  num_questions?: number;
  file_description?: string;
  institution?: string;
  program?: string;
  course_code?: string;
  topic?: string;
}

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  onMetadataChange: (metadata: OrganizationMetadata) => void;
  onValidationChange?: (result: FileValidationResult | null) => void;
  user: User | null;
}

// Tooltip component for info icons
function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-1">
      <svg
        className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help inline"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
      <div className="invisible group-hover:visible absolute z-10 w-64 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg -top-2 left-6 opacity-0 group-hover:opacity-100 transition-opacity">
        {text}
        <div className="absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 -left-1 top-3"></div>
      </div>
    </div>
  );
}

export default function FileUploadZone({ onFileSelect, onMetadataChange, onValidationChange, user }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<OrganizationMetadata>({
    num_questions: 15
  });
  const [numQuestionsError, setNumQuestionsError] = useState<string>('');
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-populate institution and program from user profile
  useEffect(() => {
    if (user && user.user_metadata) {
      const newMetadata: OrganizationMetadata = {
        ...metadata,
        institution: user.user_metadata.institution || metadata.institution,
        program: user.user_metadata.program || metadata.program
      };
      setMetadata(newMetadata);
      onMetadataChange(newMetadata);
    }
  }, [user]); // Only run when user changes

  const handleMetadataChange = (field: keyof OrganizationMetadata, value: string) => {
    const newMetadata = { ...metadata, [field]: value || undefined };
    setMetadata(newMetadata);
    onMetadataChange(newMetadata);
  };

  // Update quiz title when file is selected
  const handleFile = async (file: File) => {
    // Reset validation state
    setValidationResult(null);
    setIsValidating(true);

    // Supported file types for Gemini 2.5 Flash
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'text/plain',
      'text/markdown',
      'text/html',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
    ];

    // Validate file type
    if (!supportedTypes.includes(file.type)) {
      setIsValidating(false);
      alert('Unsupported file type. Supported formats:\n• PDF\n• Word (DOCX)\n• PowerPoint (PPTX)\n• Excel (XLSX)\n• Images (PNG, JPEG, WebP, GIF)\n• Text (TXT, MD, HTML, CSV)');
      return;
    }

    // Perform page validation
    try {
      const validation = await validateFilePages(file);
      setValidationResult(validation);
      setIsValidating(false);

      // Notify parent component of validation result
      onValidationChange?.(validation);

      // Only proceed if validation passes
      if (!validation.isValid) {
        return; // Don't set the file or call onFileSelect if validation fails
      }

      setSelectedFile(file);
      onFileSelect(file);

      // Update quiz title to filename (remove file extension)
      const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const newMetadata = { ...metadata, quiz_title: filenameWithoutExt };
      setMetadata(newMetadata);
      onMetadataChange(newMetadata);
    } catch (error) {
      console.error('File validation error:', error);
      setIsValidating(false);
      const errorResult = {
        isValid: false,
        error: 'Something went wrong while checking your file. Please try uploading it again.'
      };
      setValidationResult(errorResult);
      onValidationChange?.(errorResult);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-12 text-center transition-colors cursor-pointer ${
          isDragging
            ? 'border-primary bg-blue-50 dark:bg-blue-900/30'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-blue-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.xlsx,.txt,.md,.html,.csv,.png,.jpg,.jpeg,.webp,.gif"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="mb-4">
          <svg
            className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {selectedFile ? (
          <div>
            <p className="text-sm sm:text-base md:text-lg text-green-700 font-semibold mb-2">
              ✓ {selectedFile.name}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 mb-2">
              Drop your file here or click to browse
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Max 20MB or 10 Pages • PDF, Word, PowerPoint, Excel, Images, Text</p>
          </div>
        )}
      </div>

      {/* File Validation Status */}
      <FileValidationStatus
        validationResult={validationResult}
        isValidating={isValidating}
      />

      {/* Organization Metadata Fields - Always visible */}
      <div className="mt-6 md:mt-8" onClick={(e) => e.stopPropagation()}>
        {/* Quiz Title Field */}
        <div className="mb-4 md:mb-6">
          <label htmlFor="quiz_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quiz Title
            <InfoTooltip text="Give your quiz a descriptive name. This helps you identify quizzes later." />
          </label>
          <input
            id="quiz_title"
            type="text"
            value={metadata.quiz_title || ''}
            onChange={(e) => handleMetadataChange('quiz_title', e.target.value)}
            placeholder="Prelims Quiz 1"
            className="w-full px-3 py-2 sm:px-4 sm:py-3 md:px-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base"
          />
        </div>

        {/* Number of Questions Field */}
        <div className="mb-4 md:mb-6">
          <label htmlFor="num_questions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Number of Questions
            <InfoTooltip text="How many questions to generate (10-50). More questions take longer to generate but provide more comprehensive coverage." />
          </label>
          <input
            id="num_questions"
            type="number"
            inputMode="numeric"
            value={metadata.num_questions ?? ''}
            onChange={(e) => {
              const value = e.target.value;

              // Update the value regardless of what they type
              handleMetadataChange('num_questions', value);

              // Clear error if empty
              if (value === '') {
                setNumQuestionsError('');
                return;
              }

              // Validate if it's a number
              const numValue = parseInt(value);
              if (isNaN(numValue)) {
                setNumQuestionsError('Please enter a valid number');
              } else if (numValue < 10) {
                setNumQuestionsError('Number must be at least 10');
              } else if (numValue > 50) {
                setNumQuestionsError('Number must be at most 50');
              } else {
                setNumQuestionsError('');
              }
            }}
            placeholder="15"
            className={`w-full px-3 py-2 sm:px-4 sm:py-3 md:px-3 md:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base ${
              numQuestionsError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {numQuestionsError && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{numQuestionsError}</p>
          )}
          {!numQuestionsError && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum: 10, Maximum: 50</p>
          )}
        </div>

        {/* File Description Field */}
        <div className="mb-4 md:mb-6">
          <label htmlFor="file_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Content Description (optional)
            <InfoTooltip text="Describe the content and what kind of questions you want. AI will verify and improve your description. If left blank, AI will analyze and describe the content automatically." />
          </label>
          <textarea
            id="file_description"
            value={metadata.file_description || ''}
            onChange={(e) => handleMetadataChange('file_description', e.target.value)}
            placeholder="e.g., 'Lecture notes on thermodynamic concepts. Focus on names and definitions' or 'MCQ test with questions, options, and correct answers already compiled. Simply extract the MCQs.' Leave blank for automatic analysis."
            rows={5}
            className="w-full px-3 py-2 sm:px-4 sm:py-3 md:px-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            AI will analyze the document and enhance your description (or create one if blank)
          </p>
        </div>

        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 md:mb-4">
          Categorization (optional)
        </h3>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label htmlFor="institution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Institution
              <InfoTooltip text="Optional: The school or university. Helps organize quizzes by institution." />
            </label>
            <input
              id="institution"
              type="text"
              value={metadata.institution || ''}
              onChange={(e) => handleMetadataChange('institution', e.target.value)}
              placeholder="e.g., TIP-QC"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 md:px-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base"
            />
          </div>

          <div>
            <label htmlFor="program" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Program
              <InfoTooltip text="Optional: Your major or program. Helps group quizzes by field of study." />
            </label>
            <input
              id="program"
              type="text"
              value={metadata.program || ''}
              onChange={(e) => handleMetadataChange('program', e.target.value)}
              placeholder="e.g., BSME"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 md:px-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base"
            />
          </div>

          <div>
            <label htmlFor="course_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Course
              <InfoTooltip text="Optional: Course name or code (e.g., 'BIO 101' or 'Introduction to Biology'). Makes it easy to filter quizzes by course." />
            </label>
            <input
              id="course_code"
              type="text"
              value={metadata.course_code || ''}
              onChange={(e) => handleMetadataChange('course_code', e.target.value)}
              placeholder="e.g., PPD"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 md:px-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base"
            />
          </div>

          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Topic
              <InfoTooltip text="Optional: Specific chapter or topic covered (e.g., 'Cell Biology - Chapter 5'). Useful for organizing study materials." />
            </label>
            <input
              id="topic"
              type="text"
              value={metadata.topic || ''}
              onChange={(e) => handleMetadataChange('topic', e.target.value)}
              placeholder="e.g., Diesel Power Plants"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 md:px-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-base"
            />
          </div>
        </div>
      </div>
    </>
  );
}
