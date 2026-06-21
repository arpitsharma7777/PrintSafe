import { create } from "zustand";

interface UiState {
  activePreviewJobId: string | null;
  setActivePreviewJobId: (jobId: string | null) => void;
  globalError: string | null;
  setGlobalError: (error: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activePreviewJobId: null,
  setActivePreviewJobId: (jobId) => set({ activePreviewJobId: jobId }),
  globalError: null,
  setGlobalError: (error) => set({ globalError: error }),
}));
