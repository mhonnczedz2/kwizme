// @ts-ignore - pdfjs-dist types are not perfect for Node.js usage
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Configure worker for different environments
if (typeof window === 'undefined') {
  // Server-side (Node.js) - point to the actual worker file in node_modules
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';
} else {
  // Client-side - set worker source from CDN
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

/**
 * Extract text content from a PDF file
 * @param file - PDF file to extract text from
 * @returns Extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Load PDF document
    const loadingTask = (pdfjsLib as any).getDocument({
      data: uint8Array,
      useSystemFonts: true,
      standardFontDataUrl: undefined,
      cMapUrl: undefined,
      cMapPacked: false,
      useWorkerFetch: false,
      isEvalSupported: false,
    });
    const pdf = await loadingTask.promise;

    // Extract text from all pages
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      textParts.push(pageText);
    }

    const fullText = textParts.join('\n\n');

    if (!fullText || fullText.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    return fullText;
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Get PDF metadata
 * @param file - PDF file to extract metadata from
 * @returns PDF metadata (pages, title, etc.)
 */
export async function getPDFMetadata(file: File): Promise<{
  numPages: number;
  title?: string;
  author?: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const loadingTask = (pdfjsLib as any).getDocument({
      data: uint8Array,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const metadata = await pdf.getMetadata();

    return {
      numPages: pdf.numPages,
      title: metadata.info?.Title,
      author: metadata.info?.Author,
    };
  } catch (error) {
    console.error('PDF metadata error:', error);
    throw new Error('Failed to extract PDF metadata');
  }
}
