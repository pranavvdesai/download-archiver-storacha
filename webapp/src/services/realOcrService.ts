import { StorachaFile, UserSettings } from "../types";
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { decodeCidToString } from '../utils/decodeCidToString';

// Configure PDF.js worker - using unpkg CDN which has the correct worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export class RealOCRService {
  private settings: UserSettings;
  private processingQueue: Map<string, Promise<void>> = new Map();
  private tesseractWorker: any = null;

  constructor(settings: UserSettings) {
    this.settings = settings;
  }

  updateSettings(settings: UserSettings) {
    this.settings = settings;
  }

  shouldProcessFile(file: StorachaFile): boolean {
    if (!this.settings.ocrEnabled) return false;
    if (file.ocrStatus === "completed" || file.ocrStatus === "skipped")
      return false;
    if (file.size > this.settings.maxFileSizeForOcr) return false;

    // Process all files - type detection will happen during processing
    return true;
  }

  async processFile(
    file: StorachaFile,
    onUpdate: (updatedFile: StorachaFile) => void
  ): Promise<void> {
    // Prevent duplicate processing
    if (this.processingQueue.has(file.id)) {
      return this.processingQueue.get(file.id);
    }

    const processingPromise = this._processFileInternal(file, onUpdate);
    this.processingQueue.set(file.id, processingPromise);

    try {
      await processingPromise;
    } finally {
      this.processingQueue.delete(file.id);
    }
  }

  private async _processFileInternal(
    file: StorachaFile,
    onUpdate: (updatedFile: StorachaFile) => void
  ): Promise<void> {
    if (!this.shouldProcessFile(file)) {
      onUpdate({
        ...file,
        ocrStatus: "skipped",
        textExtractionMethod: "none",
      });
      return;
    }

    // Update status to queued
    onUpdate({
      ...file,
      ocrStatus: "queued",
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      onUpdate({
        ...file,
        ocrStatus: "processing",
        processingStartedAt: new Date(),
      });

      const fileBlob = await this.downloadFileFromIPFS(file.cid);

      let extractedText = "";
      let method: "embedded" | "ocr" | "none" = "none";
      const detectedType = fileBlob.type || file.mimeType;

      if (detectedType === "application/pdf" || file.name?.toLowerCase().endsWith('.pdf')) {
        const embeddedText = await this.extractTextFromPDF(fileBlob);

        if (embeddedText && embeddedText.trim().length > 10) {
          extractedText = embeddedText;
          method = "embedded";
        } else {
          extractedText = await this.performOCROnPDF(fileBlob);
          method = "ocr";
        }
      } else if (detectedType.startsWith('image/')) {
        extractedText = await this.performOCROnImage(fileBlob);
        method = "ocr";
      } else {
        throw new Error(`Unsupported file type: ${detectedType}`);
      }

      const updatedFile = {
        ...file,
        ocrStatus: "completed" as const,
        extractedText: extractedText.trim(),
        ocrText: extractedText.trim(),
        textExtractionMethod: method,
        processingCompletedAt: new Date(),
        ocrError: undefined,
      };

      onUpdate(updatedFile);
    } catch (error) {
      console.error(`OCR processing failed for file ${file.id}:`, error);

      onUpdate({
        ...file,
        ocrStatus: "failed",
        ocrError:
          error instanceof Error ? error.message : "Unknown error occurred",
        processingCompletedAt: new Date(),
      });
    }
  }

  private async downloadFileFromIPFS(cid: string | Uint8Array | any): Promise<Blob> {
    const cidString = decodeCidToString(cid);

    if (!cidString) {
      throw new Error('Invalid CID format');
    }

    const gatewayUrl = `https://${cidString}.ipfs.w3s.link/`;

    const response = await fetch(gatewayUrl, {
      signal: AbortSignal.timeout(this.settings.ocrTimeout)
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return await response.blob();
  }

  private async extractTextFromPDF(blob: Blob): Promise<string> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return '';
    }
  }

  private async performOCROnPDF(blob: Blob): Promise<string> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        }).promise;

        const imageBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to convert canvas to blob'));
          }, 'image/png');
        });

        const pageText = await this.performOCROnImage(imageBlob);
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      }

      return fullText.trim();
    } catch (error) {
      console.error('Error performing OCR on PDF:', error);
      throw error;
    }
  }

  private async performOCROnImage(blob: Blob): Promise<string> {
    try {
      if (!this.tesseractWorker) {
        this.tesseractWorker = await createWorker('eng');
        await this.tesseractWorker.setParameters({
          tessedit_pageseg_mode: '1',
          preserve_interword_spaces: '1',
        });
      }

      const imageUrl = URL.createObjectURL(blob);
      const { data: { text } } = await this.tesseractWorker.recognize(imageUrl);
      URL.revokeObjectURL(imageUrl);

      return text;
    } catch (error) {
      console.error('Error performing OCR on image:', error);
      throw error;
    }
  }

  async cleanup() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }

  getProcessingStatus(fileId: string): boolean {
    return this.processingQueue.has(fileId);
  }
}

// Default settings
export const DEFAULT_OCR_SETTINGS: UserSettings = {
  ocrEnabled: true,
  maxFileSizeForOcr: 50 * 1024 * 1024, // 50MB
  ocrTimeout: 60000, // 60 seconds (increased for real processing)
};
