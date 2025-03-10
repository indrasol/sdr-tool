
import type { ProjectStatus, ProjectPriority } from '../../../types/projectTypes';

// Helper function to normalize status values
export const normalizeStatus = (status: string): string => {
  // Handle uppercase with underscores (e.g., "IN_PROGRESS" → "In Progress")
  if (status.includes('_')) {
    return status.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  // Handle simple lowercase or other cases
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

// Helper function to normalize priority values
export const normalizePriority = (priority: string): string => {
  // Handle uppercase (e.g., "MEDIUM" → "Medium")
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
};

export const getStatusColor = (status: ProjectStatus): string => {

  // Normalize the status first
  const normalizedStatus = normalizeStatus(status);

  switch (normalizedStatus) {
    case 'Not Started':
      return 'bg-slate-400 text-slate-800';
    case 'Planned':
      return 'bg-amber-100 text-amber-800';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'On Hold':
      return 'bg-red-100 text-red-800';
    default:
      // Provide a fallback for any unrecognized status
      console.warn(`Unrecognized status: ${status}`);
      return 'bg-gray-100 text-gray-700';
  }
};

export const getPriorityColor = (priority: ProjectPriority): string => {

  // Normalize the priority first
  const normalizedPriority = normalizePriority(priority);
  switch (normalizedPriority) {
    case 'Low':
      return 'bg-green-100 text-green-800';
    case 'Medium':
      return 'bg-amber-100 text-amber-800';
    case 'High':
      return 'bg-orange-100 text-orange-800';
    case 'Critical':
      return 'bg-red-100 text-red-800';
    default:
      // Provide a fallback for any unrecognized priority
      console.warn(`Unrecognized priority: ${priority}`);
      return 'bg-gray-100 text-gray-700';
  }
};

export const getBorderColor = (priority: ProjectPriority): string => {
  // Normalize the priority first
  const normalizedPriority = normalizePriority(priority);
  switch (normalizedPriority) {
    case 'Critical':
      return '#f87171';
    case 'High':
      return '#fb923c';
    case 'Medium':
      return '#fbbf24';
    case 'Low':
      return '#4ade80';
    default:
      return '#e5e7eb';
  }
};