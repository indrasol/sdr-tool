
import { SecurityFinding } from './types';

export const MOCK_FINDINGS: SecurityFinding[] = [
  {
    id: "CVE-2023-45231",
    component: "Authentication Service",
    category: "Authentication",
    description: "Weak password hashing algorithm (MD5) detected in auth flow",
    criticality: "Critical",
    status: "Open",
    mitigation: "Implement bcrypt or Argon2 password hashing",
    timestamp: "2023-08-15"
  },
  {
    id: "CVE-2023-38947",
    component: "User API",
    category: "API Security",
    description: "Missing rate limiting controls on login endpoints",
    criticality: "High",
    status: "In Progress",
    mitigation: "Implement rate limiting middleware with token bucket algorithm",
    timestamp: "2023-08-10"
  },
  {
    id: "CVE-2023-29384",
    component: "Payment Processor",
    category: "Data Security",
    description: "Sensitive credit card data logged in plaintext",
    criticality: "Critical",
    status: "Mitigated",
    mitigation: "Implemented masked logging and removed existing logs",
    timestamp: "2023-07-28"
  },
  {
    id: "CVE-2023-11126",
    component: "Admin Dashboard",
    category: "Access Control",
    description: "Insufficient access controls for admin operations",
    criticality: "High",
    status: "In Progress",
    mitigation: "Implement role-based access control with proper permission checks",
    timestamp: "2023-07-15"
  },
  {
    id: "CVE-2023-67521",
    component: "File Upload Service",
    category: "Input Validation",
    description: "Possible path traversal attack in file upload functionality",
    criticality: "High",
    status: "Open",
    mitigation: "Implement strict validation for filenames and sanitize paths",
    timestamp: "2023-08-05"
  },
  {
    id: "CVE-2023-21563",
    component: "Notification Service",
    category: "Configuration",
    description: "Insecure default configuration exposes internal metrics",
    criticality: "Medium",
    status: "Mitigated",
    mitigation: "Updated default configuration and secured metrics endpoint",
    timestamp: "2023-07-22"
  },
  {
    id: "CVE-2023-19874",
    component: "Database Layer",
    category: "SQL Injection",
    description: "Potential SQL injection in order search functionality",
    criticality: "High",
    status: "Mitigated",
    mitigation: "Implemented prepared statements for all database queries",
    timestamp: "2023-08-01"
  },
  {
    id: "CVE-2023-32568",
    component: "Session Management",
    category: "Session Security",
    description: "Session tokens stored with insufficient security measures",
    criticality: "Medium",
    status: "Open",
    mitigation: "Implement httpOnly and secure flags for cookies",
    timestamp: "2023-08-12"
  }
];