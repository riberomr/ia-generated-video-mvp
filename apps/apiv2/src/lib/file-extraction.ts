import * as mammoth from "mammoth";

import * as path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

// Ensure the worker is loaded from the correct location in the Lambda environment
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, "pdf.worker.js");

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
