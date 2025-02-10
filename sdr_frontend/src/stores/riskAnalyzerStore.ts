import { create } from 'zustand';

interface RiskAnalyzerState {
  riskData: any; // Replace 'any' with the actual type if known
  assessmentName: string;
  risks: Array<{ risk: string; recommendation: string; source: string }>;
  setRiskData: (data: any) => void; // Replace 'any' with the actual type if known
}

export const useRiskAnalyzerStore = create<RiskAnalyzerState>((set) => ({
  riskData: null,
  assessmentName: '',
  risks: [],
  setRiskData: (data) => set({ riskData: data }),
}));