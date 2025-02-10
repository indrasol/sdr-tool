import { SecurityItem } from "./types";

export const securityData: SecurityItem[] = [
  {
    id: "1",
    name: "Password Policy Review",
    risk: "Weak Password Requirements",
    recommendation: "Implement stronger password policies",
    status: "High",
    source: "Security Audit",
    note: "Current password policy allows simple passwords that can be easily compromised",
  },
  {
    id: "2",
    name: "Access Control Assessment",
    risk: "Excessive User Permissions",
    recommendation: "Review and restrict user access rights",
    status: "Medium",
    source: "Internal Review",
    note: "Multiple users have unnecessary admin privileges",
  },
  {
    id: "3",
    name: "Network Security Scan",
    risk: "Open Ports Detected",
    recommendation: "Close unnecessary ports",
    status: "High",
    source: "Automated Scan",
    note: "Several unused ports are open and could be exploited",
  },
  {
    id: "4",
    name: "Data Encryption Review",
    risk: "Unencrypted Data Transfer",
    recommendation: "Implement SSL/TLS",
    status: "Medium",
    source: "Compliance Check",
    note: "Some data transfers are not using encryption",
  },
  {
    id: "5",
    name: "Backup System Review",
    risk: "Irregular Backups",
    recommendation: "Automate backup process",
    status: "Low",
    source: "System Logs",
    note: "Backups are being performed manually and inconsistently",
  },
];