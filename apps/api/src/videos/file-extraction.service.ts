import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

@Injectable()
export class FileExtractionService {
    private readonly logger = new Logger(FileExtractionService.name);

    async extractTextFromPdf(buffer: Buffer): Promise<string> {
        try {
            // pdf-parse v2 usage
            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            await parser.destroy(); // cleanup

            this.logger.log(`Extracted ${data.text.length} characters from PDF.`);
            return data.text;
        } catch (error) {
            this.logger.error('Failed to extract text from PDF', error);
            throw new Error('Failed to parse PDF file');
        }
    }

    async extractTextFromDocx(buffer: Buffer): Promise<string> {
        try {
            const result = await mammoth.extractRawText({ buffer });
            this.logger.log(`Extracted ${result.value.length} characters from DOCX.`);
            if (result.messages.length > 0) {
                this.logger.warn('Mammoth messages:', result.messages);
            }
            return result.value;
        } catch (error) {
            this.logger.error('Failed to extract text from DOCX', error);
            throw new Error('Failed to parse DOCX file');
        }
    }
}
