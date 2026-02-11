import { Injectable, Logger } from "@nestjs/common";
import * as mammoth from "mammoth";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse");

@Injectable()
export class FileExtractionService {
  private readonly logger = new Logger(FileExtractionService.name);

  async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      this.logger.log(`pdfParse is: ${typeof pdfParse}`);
      if (typeof pdfParse !== "function") {
        this.logger.log(`pdfParse keys: ${Object.keys(pdfParse)}`);
      }
      // Handle potential default export wrapping
      const parseFunc =
        typeof pdfParse === "function" ? pdfParse : pdfParse.default;

      if (typeof parseFunc !== "function") {
        throw new Error(
          `pdf-parse library not loaded correctly. Got: ${typeof pdfParse}`,
        );
      }

      const data = await parseFunc(buffer);
      this.logger.log(`Extracted ${data.text.length} characters from PDF.`);
      return data.text;
    } catch (error) {
      this.logger.error("Failed to extract text from PDF", error);
      throw new Error("Failed to parse PDF file");
    }
  }

  async extractTextFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      this.logger.log(`Extracted ${result.value.length} characters from DOCX.`);
      if (result.messages.length > 0) {
        this.logger.warn("Mammoth messages:", result.messages);
      }
      return result.value;
    } catch (error) {
      this.logger.error("Failed to extract text from DOCX", error);
      throw new Error("Failed to parse DOCX file");
    }
  }
}
