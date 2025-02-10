export type SecurityItem = {
  id: string;
  name: string;
  risk: string;
  recommendation: string;
  source: string;
  status: "High" | "Medium" | "Low";
  note?: string;
};