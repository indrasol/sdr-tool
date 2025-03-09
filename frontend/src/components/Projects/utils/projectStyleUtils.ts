
import type { ProjectStatus, ProjectPriority } from '../types/projectTypes';

export const getStatusColor = (status: ProjectStatus): string => {
  switch (status) {
    case 'Not Started':
      return 'bg-gray-200 text-gray-800';
    case 'Started':
      return 'bg-amber-100 text-amber-800';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'On Hold':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

export const getPriorityColor = (priority: ProjectPriority): string => {
  switch (priority) {
    case 'Low':
      return 'bg-green-100 text-green-800';
    case 'Medium':
      return 'bg-amber-100 text-amber-800';
    case 'High':
      return 'bg-orange-100 text-orange-800';
    case 'Critical':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

export const getBorderColor = (priority: ProjectPriority): string => {
  switch (priority) {
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