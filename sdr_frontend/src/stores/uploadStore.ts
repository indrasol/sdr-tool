import { create } from 'zustand';

interface UploadState {
  data: any; // Replace 'any' with your expected data type
  setData: (data: any) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
})); 