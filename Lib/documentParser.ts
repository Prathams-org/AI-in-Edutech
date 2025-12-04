// lib/documentParser.ts - Client-side document parsing
import mammoth from "mammoth";
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker - use local installation
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

export async function parseDocument(file: File): Promise<string> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (fileExtension === 'pdf') {
    return await parsePDF(file);
  } else if (fileExtension === 'doc' || fileExtension === 'docx') {
    return await parseDOC(file);
  } else {
    throw new Error('Unsupported file type. Please upload PDF or DOC/DOCX files.');
  }
}

async function parsePDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument(typedArray);
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file. Please ensure the PDF contains readable text.');
  }
}

async function parseDOC(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text content found in document');
    }
    
    return result.value;
  } catch (error) {
    console.error('Error parsing DOC:', error);
    throw new Error('Failed to parse DOC/DOCX file. Please ensure the file is not corrupted.');
  }
}
