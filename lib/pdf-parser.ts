import { extractText, getDocumentProxy } from 'unpdf';

/**
 * Extract text content from a PDF file
 * @param file - PDF file to extract text from
 * @returns Extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text using unpdf
    const { text } = await extractText(new Uint8Array(arrayBuffer), {
      mergePages: true,
    });

    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    return text;
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

    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
    const metadata = await pdf.getMetadata();

    // Type assertion for metadata.info
    const info = metadata.info as { Title?: string; Author?: string } | undefined;

    return {
      numPages: pdf.numPages,
      title: info?.Title,
      author: info?.Author,
    };
  } catch (error) {
    console.error('PDF metadata error:', error);
    throw new Error('Failed to extract PDF metadata');
  }
}
