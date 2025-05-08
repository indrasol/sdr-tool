import type { ProjectStatus, ProjectPriority } from '../../../types/projectTypes';

// Helper function to normalize status values
export const normalizeStatus = (status: string): string => {
  if (!status) {
    return 'Unknown';
  }
  
  // Handle uppercase with underscores (e.g., "NOT_STARTED" → "Not Started")
  if (status.includes('_')) {
    return status.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Handle camelCase (e.g., "notStarted" → "Not Started")
  if (/[a-z][A-Z]/.test(status)) {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Handle normal case with spaces (e.g., "In Progress")
  if (status.includes(' ')) {
    return status.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Handle simple lowercase or other cases
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

// Helper function to normalize priority values
export const normalizePriority = (priority: string): string => {
  if (!priority) {
    return 'Unknown';
  }
  
  // Handle uppercase with underscores (e.g., "HIGH_PRIORITY" → "High Priority")
  if (priority.includes('_')) {
    return priority.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Handle normal case (e.g., "MEDIUM" → "Medium")
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
};

export const getStatusColor = (status: ProjectStatus): string => {
  if (!status) {
    return 'bg-gray-100 text-gray-700';
  }

  // Convert to uppercase for case-insensitive comparison
  const statusUpper = status.toUpperCase();

  // Handle both formats: 'NOT_STARTED' and 'Not Started'
  if (statusUpper === 'NOT_STARTED' || statusUpper === 'NOT STARTED') {
    return 'bg-slate-400 text-slate-800';
  } else if (statusUpper === 'PLANNED') {
    return 'bg-amber-100 text-amber-800';
  } else if (statusUpper === 'IN_PROGRESS' || statusUpper === 'IN PROGRESS') {
    return 'bg-blue-100 text-blue-800';
  } else if (statusUpper === 'COMPLETED') {
    return 'bg-green-100 text-green-800';
  } else if (statusUpper === 'ON_HOLD' || statusUpper === 'ON HOLD') {
    return 'bg-red-100 text-red-800';
  } else {
    // Provide a fallback for any unrecognized status
    console.warn(`Unrecognized status: ${status}`);
    return 'bg-gray-100 text-gray-700';
  }
};

export const getPriorityColor = (priority: ProjectPriority): string => {
  if (!priority) {
    return 'bg-gray-100 text-gray-700';
  }

  // Convert to uppercase for case-insensitive comparison
  const priorityUpper = priority.toUpperCase();

  // Handle both formats: 'LOW' and 'Low'
  if (priorityUpper === 'LOW') {
    return 'bg-green-100 text-green-800';
  } else if (priorityUpper === 'MEDIUM') {
    return 'bg-amber-100 text-amber-800';
  } else if (priorityUpper === 'HIGH') {
    return 'bg-orange-100 text-orange-800';
  } else if (priorityUpper === 'CRITICAL') {
    return 'bg-red-100 text-red-800';
  } else {
    // Provide a fallback for any unrecognized priority
    console.warn(`Unrecognized priority: ${priority}`);
    return 'bg-gray-100 text-gray-700';
  }
};

export const getBorderColor = (priority: ProjectPriority): string => {
  if (!priority) {
    return '#e5e7eb';
  }

  // Convert to uppercase for case-insensitive comparison
  const priorityUpper = priority.toUpperCase();
  
  // Handle both formats: 'CRITICAL' and 'Critical'
  if (priorityUpper === 'CRITICAL') {
    return '#f87171';
  } else if (priorityUpper === 'HIGH') {
    return '#fb923c';
  } else if (priorityUpper === 'MEDIUM') {
    return '#fbbf24';
  } else if (priorityUpper === 'LOW') {
    return '#4ade80';
  } else {
    return '#e5e7eb';
  }
};