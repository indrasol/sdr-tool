
import { useState } from 'react';

/**
 * Hook for managing projects view state
 */
export const useProjectsView = () => {
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  return {
    viewType,
    setViewType,
  };
};