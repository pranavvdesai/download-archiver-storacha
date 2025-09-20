import { StorachaFile, UserSettings } from "../types";

// File size limits (in bytes)
const MAX_FILE_SIZE_FOR_OCR = 50 * 1024 * 1024; // 50MB
const OCR_TIMEOUT = 30000; // 30 seconds

// Supported file types for OCR
const OCR_SUPPORTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/tiff",
  "image/bmp",
  "image/webp",
];

export class OCRService {
  private settings: UserSettings;
  private processingQueue: Map<string, Promise<void>> = new Map();

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

    return OCR_SUPPORTED_TYPES.includes(file.mimeType);
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

    // Wait a moment before starting processing to show queued state
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Update status to processing
      onUpdate({
        ...file,
        ocrStatus: "processing",
        processingStartedAt: new Date(),
      });

      // Wait a moment to show processing state
      await new Promise((resolve) => setTimeout(resolve, 500));

      let extractedText = "";
      let method: "embedded" | "ocr" | "none" = "none";

      if (file.mimeType === "application/pdf") {
        // Try to extract embedded text first
        const embeddedText = await this.extractEmbeddedTextFromPDF(file);
        if (embeddedText && embeddedText.trim().length > 0) {
          extractedText = embeddedText;
          method = "embedded";
        } else {
          // Fall back to OCR
          extractedText = await this.performOCR(file);
          method = "ocr";
        }
      } else {
        // For images, use OCR directly
        extractedText = await this.performOCR(file);
        method = "ocr";
      }

      // Update with results
      onUpdate({
        ...file,
        ocrStatus: "completed",
        extractedText: extractedText.trim(),
        textExtractionMethod: method,
        processingCompletedAt: new Date(),
        ocrError: undefined,
      });
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

  private async extractEmbeddedTextFromPDF(
    file: StorachaFile
  ): Promise<string> {
    // Simulate PDF text extraction
    // In a real implementation, you'd use a library like pdf-parse or PDF.js
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock: some PDFs have embedded text, others don't
        const hasEmbeddedText = Math.random() > 0.5;
        if (hasEmbeddedText) {
          resolve(
            `Embedded text content from ${file.name}. This document contains project requirements, specifications, and implementation details that can now be searched.`
          );
        } else {
          resolve("");
        }
      }, 2000); // Longer delay to show processing
    });
  }

  private async performOCR(file: StorachaFile): Promise<string> {
    // Simulate OCR processing with timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("OCR processing timed out"));
      }, this.settings.ocrTimeout);

      // Simulate OCR processing time
      const processingTime = Math.random() * 4000 + 3000; // 3-7 seconds

      setTimeout(() => {
        clearTimeout(timeout);

        // Mock OCR results based on file type
        if (file.mimeType === "application/pdf") {
          resolve(
            `OCR extracted text from scanned PDF: ${file.name}. This document contains important information about the project requirements and specifications.`
          );
        } else {
          resolve(
            `OCR extracted text from image: ${file.name}. This image contains text that has been successfully recognized and extracted.`
          );
        }
      }, processingTime);
    });
  }

  getProcessingStatus(fileId: string): boolean {
    return this.processingQueue.has(fileId);
  }
}

// Default settings
export const DEFAULT_OCR_SETTINGS: UserSettings = {
  ocrEnabled: true,
  maxFileSizeForOcr: MAX_FILE_SIZE_FOR_OCR,
  ocrTimeout: OCR_TIMEOUT,
};
