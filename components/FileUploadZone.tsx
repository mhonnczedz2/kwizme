'use client';

import { useState, useRef } from 'react';

export interface OrganizationMetadata {
  quiz_title?: string;
  num_questions?: number;
  institution?: string;
  program?: string;
  course_code?: string;
  topic?: string;
}

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  onMetadataChange: (metadata: OrganizationMetadata) => void;
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
      <div className="invisible group-hover:visible absolute z-10 w-64 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-6 opacity-0 group-hover:opacity-100 transition-opacity">
        {text}
        <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-3"></div>
      </div>
    </div>
  );
}

export default function FileUploadZone({ onFileSelect, onMetadataChange }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<OrganizationMetadata>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMetadataChange = (field: keyof OrganizationMetadata, value: string) => {
    const newMetadata = { ...metadata, [field]: value || undefined };
    setMetadata(newMetadata);
    onMetadataChange(newMetadata);
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

  const handleFile = (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          isDragging
            ? 'border-primary bg-blue-50'
            : 'border-gray-300 hover:border-primary'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
            <p className="text-lg text-green-700 font-semibold mb-2">
              ✓ {selectedFile.name}
            </p>
            <p className="text-sm text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg text-gray-700 mb-2">
              Drop your PDF here or click to browse
            </p>
            <p className="text-sm text-gray-500">Max 10MB, .pdf only</p>
          </div>
        )}
      </div>

      {/* Organization Metadata Fields - Only show when file is selected */}
      {selectedFile && (
        <div className="mt-8" onClick={(e) => e.stopPropagation()}>
          {/* Quiz Title Field */}
          <div className="mb-6">
            <label htmlFor="quiz_title" className="block text-sm font-medium text-gray-700 mb-1">
              Quiz Title
              <InfoTooltip text="Give your quiz a descriptive name. If left empty, the filename will be used. This helps you identify quizzes later." />
            </label>
            <input
              id="quiz_title"
              type="text"
              value={metadata.quiz_title || ''}
              onChange={(e) => handleMetadataChange('quiz_title', e.target.value)}
              placeholder={`e.g., ${selectedFile.name.replace('.pdf', '')}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Number of Questions Field */}
          <div className="mb-6">
            <label htmlFor="num_questions" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Questions
              <InfoTooltip text="How many questions to generate (10-50). More questions take longer to generate but provide more comprehensive coverage." />
            </label>
            <input
              id="num_questions"
              type="number"
              min="10"
              max="50"
              value={metadata.num_questions || 15}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 10 && value <= 50) {
                  handleMetadataChange('num_questions', e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum: 10, Maximum: 50</p>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Organization (optional)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
                Institution
                <InfoTooltip text="Optional: The school or university (e.g., 'UC Berkeley'). Helps organize quizzes by institution." />
              </label>
              <input
                id="institution"
                type="text"
                value={metadata.institution || ''}
                onChange={(e) => handleMetadataChange('institution', e.target.value)}
                placeholder="e.g., UC Berkeley"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">
                Program
                <InfoTooltip text="Optional: Your major or program (e.g., 'Biology Major'). Helps group quizzes by field of study." />
              </label>
              <input
                id="program"
                type="text"
                value={metadata.program || ''}
                onChange={(e) => handleMetadataChange('program', e.target.value)}
                placeholder="e.g., Biology Major"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="course_code" className="block text-sm font-medium text-gray-700 mb-1">
                Course
                <InfoTooltip text="Optional: Course name or code (e.g., 'BIO 101' or 'Introduction to Biology'). Makes it easy to filter quizzes by course." />
              </label>
              <input
                id="course_code"
                type="text"
                value={metadata.course_code || ''}
                onChange={(e) => handleMetadataChange('course_code', e.target.value)}
                placeholder="e.g., BIO 101"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                Topic
                <InfoTooltip text="Optional: Specific chapter or topic covered (e.g., 'Cell Biology - Chapter 5'). Useful for organizing study materials." />
              </label>
              <input
                id="topic"
                type="text"
                value={metadata.topic || ''}
                onChange={(e) => handleMetadataChange('topic', e.target.value)}
                placeholder="e.g., Cell Biology - Chapter 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
