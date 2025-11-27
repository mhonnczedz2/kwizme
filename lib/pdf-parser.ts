import pdfParse from 'pdf-parse';

/**
 * Extract text content from a PDF file
 * @param file - PDF file to extract text from
 * @returns Extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const data = await pdfParse(buffer);

    // Return extracted text
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF');
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
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);

    return {
      numPages: data.numpages,
      title: data.info?.Title,
      author: data.info?.Author,
    };
  } catch (error) {
    console.error('PDF metadata error:', error);
    throw new Error('Failed to extract PDF metadata');
  }
}
