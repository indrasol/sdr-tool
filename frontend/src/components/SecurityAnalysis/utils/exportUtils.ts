
import { SecurityFinding } from '../types';

/**
 * Convert security findings data to CSV format and trigger download
 * @param findings Array of security findings
 * @param filename Name of the exported file
 */
export const exportToCSV = (findings: SecurityFinding[], filename: string) => {
  // Define columns for the report
  const columns = [
    'ID',
    'Component',
    'Category',
    'Description',
    'Criticality',
    'Status',
    'Mitigation',
    'Timestamp'
  ];

  // Create CSV header row
  const csvContent = [
    columns.join(','),
    // Map each finding to a CSV row
    ...findings.map(finding => {
      return [
        `"${finding.id}"`,
        `"${finding.component}"`,
        `"${finding.category}"`,
        `"${finding.description.replace(/"/g, '""')}"`, // Escape quotes in description
        `"${finding.criticality}"`,
        `"${finding.status}"`,
        `"${finding.mitigation.replace(/"/g, '""')}"`, // Escape quotes in mitigation
        `"${finding.timestamp}"`
      ].join(',');
    })
  ].join('\n');

  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Set up download attributes
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  // Append to DOM, trigger download, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate a formatted HTML table for security findings
 * @param findings Array of security findings
 * @returns HTML string containing the table
 */
export const generateHTMLTable = (findings: SecurityFinding[]) => {
  const headerRow = `
    <tr>
      <th>ID</th>
      <th>Component</th>
      <th>Category</th>
      <th>Description</th>
      <th>Criticality</th>
      <th>Status</th>
      <th>Mitigation</th>
      <th>Timestamp</th>
    </tr>
  `;

  const rows = findings.map(finding => {
    const criticalityClass = 
      finding.criticality === 'Critical' ? 'critical' : 
      finding.criticality === 'High' ? 'high' : 
      finding.criticality === 'Medium' ? 'medium' : 'low';
    
    const statusClass = 
      finding.status === 'Open' ? 'open' : 
      finding.status === 'In Progress' ? 'in-progress' : 
      finding.status === 'Mitigated' ? 'mitigated' : 'accepted';
    
    return `
      <tr>
        <td>${finding.id}</td>
        <td>${finding.component}</td>
        <td>${finding.category}</td>
        <td>${finding.description}</td>
        <td class="${criticalityClass}">${finding.criticality}</td>
        <td class="${statusClass}">${finding.status}</td>
        <td>${finding.mitigation}</td>
        <td>${finding.timestamp}</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="security-findings-table">
      <thead>
        ${headerRow}
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};