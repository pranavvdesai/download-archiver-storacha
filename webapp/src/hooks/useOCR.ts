import { useState, useEffect, useCallback } from "react";
import { StorachaFile, UserSettings } from "../types";
import { RealOCRService, DEFAULT_OCR_SETTINGS } from "../services/realOcrService";

export const useOCR = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_OCR_SETTINGS);
  const [ocrService] = useState(() => new RealOCRService(DEFAULT_OCR_SETTINGS));

  // Update service when settings change
  useEffect(() => {
    ocrService.updateSettings(settings);
  }, [settings, ocrService]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const processFile = useCallback(
    async (
      file: StorachaFile,
      onUpdate: (updatedFile: StorachaFile) => void
    ) => {
      await ocrService.processFile(file, onUpdate);
    },
    [ocrService]
  );

  const shouldProcessFile = useCallback(
    (file: StorachaFile): boolean => {
      return ocrService.shouldProcessFile(file);
    },
    [ocrService]
  );

  const isProcessing = useCallback(
    (fileId: string): boolean => {
      return ocrService.getProcessingStatus(fileId);
    },
    [ocrService]
  );

  return {
    settings,
    updateSettings,
    processFile,
    shouldProcessFile,
    isProcessing,
  };
};
