/**
 * Client-side file validation utilities
 * Validates page count and file properties before upload
 */

export interface FileValidationResult {
  isValid: boolean;
  pageCount?: number;
  error?: string;
  fileInfo?: {
    name: string;
    size: string;
    type: string;
  };
}

/**
 * Get page count for PDF files using pdf-lib
 */
async function validatePDF(file: File): Promise<FileValidationResult> {
  try {
    // Dynamic import of pdf-lib to avoid SSR issues
    const { PDFDocument } = await import('pdf-lib');

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();

    console.log(`PDF validation: ${file.name} has ${pageCount} pages`);

    const result = {
      isValid: pageCount <= 10,
      pageCount,
      error: pageCount > 10 ? `This PDF has ${pageCount} pages. Please choose a PDF with 10 pages or fewer.` : undefined,
      fileInfo: {
        name: file.name,
        size: formatFileSize(file.size),
        type: 'PDF'
      }
    };

    console.log('PDF validation result:', result);
    return result;
  } catch (error) {
    console.error('PDF validation error:', error);

    // Provide more specific error messages based on the error type
    let errorMessage = 'Unable to read this PDF file. Please try a different file.';

    if (error instanceof Error) {
      const errorStr = error.message.toLowerCase();
      if (errorStr.includes('password') || errorStr.includes('encrypted')) {
        errorMessage = 'This PDF is password-protected. Please remove the password and try again.';
      } else if (errorStr.includes('corrupt') || errorStr.includes('invalid')) {
        errorMessage = 'This PDF file appears to be corrupted. Please try a different file.';
      } else if (errorStr.includes('unsupported') || errorStr.includes('format')) {
        errorMessage = 'This PDF format is not supported. Please save it in a standard PDF format and try again.';
      }
    }

    return {
      isValid: false,
      error: errorMessage,
      fileInfo: {
        name: file.name,
        size: formatFileSize(file.size),
        type: 'PDF'
      }
    };
  }
}

/**
 * Estimate page count for DOCX files by analyzing content
 */
async function validateDOCX(file: File): Promise<FileValidationResult> {
  try {
    // For DOCX, we'll estimate based on file size and content
    // This is an approximation since true page count requires rendering
    const arrayBuffer = await file.arrayBuffer();

    // Simple heuristic: extract text content and estimate pages
    // Average: ~500 words per page, ~5 characters per word = ~2500 chars per page
    const uint8Array = new Uint8Array(arrayBuffer);

    // Look for text content in the DOCX (simplified approach)
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const content = decoder.decode(uint8Array);

    // Rough estimation based on content length
    const estimatedChars = content.length;
    const estimatedPages = Math.max(1, Math.ceil(estimatedChars / 3000)); // Conservative estimate

    // Also consider file size as a factor (typical DOCX: 20-100KB per page with images)
    const sizeBasedPages = Math.max(1, Math.ceil(file.size / (50 * 1024))); // 50KB per page average

    // Take the higher estimate to be conservative
    const pageCount = Math.max(estimatedPages, sizeBasedPages);

    return {
      isValid: pageCount <= 10,
      pageCount,
      error: pageCount > 10 ? `This document appears to have about ${pageCount} pages. Please choose a document with 10 pages or fewer.` : undefined,
      fileInfo: {
        name: file.name,
        size: formatFileSize(file.size),
        type: 'Word Document'
      }
    };
  } catch (error) {
    console.error('DOCX validation error:', error);
    return {
      isValid: false,
      error: 'Unable to analyze this Word document. Please try a different file or save it in a newer format.'
    };
  }
}

/**
 * Estimate slide count for PPTX files
 */
async function validatePPTX(file: File): Promise<FileValidationResult> {
  try {
    // For PPTX, we'll estimate based on file structure
    // Similar approach to DOCX but with different heuristics for slides
    const sizeBasedSlides = Math.max(1, Math.ceil(file.size / (100 * 1024))); // ~100KB per slide average

    return {
      isValid: sizeBasedSlides <= 10,
      pageCount: sizeBasedSlides,
      error: sizeBasedSlides > 10 ? `This presentation appears to have about ${sizeBasedSlides} slides. Please choose a presentation with 10 slides or fewer.` : undefined,
      fileInfo: {
        name: file.name,
        size: formatFileSize(file.size),
        type: 'PowerPoint Presentation'
      }
    };
  } catch (error) {
    console.error('PPTX validation error:', error);
    return {
      isValid: false,
      error: 'Unable to analyze this PowerPoint presentation. Please try a different file.'
    };
  }
}

/**
 * Validate other file types (images, text files, etc.)
 */
function validateOtherFile(file: File): FileValidationResult {
  const fileType = getFileTypeDescription(file.type, file.name);

  // For non-paginated files, consider them as single-page
  return {
    isValid: true,
    pageCount: 1,
    fileInfo: {
      name: file.name,
      size: formatFileSize(file.size),
      type: fileType
    }
  };
}

/**
 * Main validation function - validates any supported file type
 */
export async function validateFilePages(file: File): Promise<FileValidationResult> {
  // First validate file size (20MB limit)
  if (file.size > 20 * 1024 * 1024) {
    return {
      isValid: false,
      error: `File size is ${formatFileSize(file.size)}. Please choose a file under 20MB.`,
      fileInfo: {
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileTypeDescription(file.type, file.name)
      }
    };
  }

  // Validate by file type
  if (file.type === 'application/pdf') {
    return await validatePDF(file);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await validateDOCX(file);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return await validatePPTX(file);
  } else {
    // For other supported file types (images, text files, etc.)
    return validateOtherFile(file);
  }
}

/**
 * Utility function to format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get human-readable file type description
 */
function getFileTypeDescription(mimeType: string, filename: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.includes('text')) return 'Text File';
  if (filename.endsWith('.md')) return 'Markdown';
  if (filename.endsWith('.csv')) return 'CSV';
  if (filename.endsWith('.html')) return 'HTML';
  if (mimeType.includes('excel') || filename.endsWith('.xlsx')) return 'Excel Spreadsheet';
  return 'Document';
}