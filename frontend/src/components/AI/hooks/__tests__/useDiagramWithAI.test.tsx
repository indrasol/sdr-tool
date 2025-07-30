// @ts-nocheck
import { renderHook, act } from '@testing-library/react'
import { useDiagramWithAI } from '../useDiagramWithAI'

// Mock API helpers -----------------------------------------------------------
jest.mock('@/services/apiService', () => ({
  getDiagramView: jest.fn().mockResolvedValue({ nodes: [], edges: [] }),
  getIconTheme: jest.fn().mockResolvedValue({ /* fake registry */ }),
}));

const { getDiagramView, getIconTheme } = require('@/services/apiService');

describe('useDiagramWithAI – view switching', () => {
  afterEach(() => {
    jest.clearAllMocks();
    // reset global registry
    // @ts-ignore
    delete window.__ICON_THEME_REGISTRY__;
  });

  it('updates availableViews and switches view correctly', async () => {
    const { result } = renderHook(() => useDiagramWithAI([], [], null, null, 123));

    // initial state
    expect(result.current.availableViews).toEqual(['reactflow']);
    expect(result.current.activeView).toBe('reactflow');

    // Persist available views from backend
    act(() => {
      result.current.updateAvailableViews(['reactflow', 'd2']);
    });

    expect(result.current.availableViews).toEqual(['reactflow', 'd2']);

    // Switch to D2 view
    await act(async () => {
      await result.current.switchView('d2');
    });

    expect(getDiagramView).toHaveBeenCalledWith(123, 'd2');
    expect(result.current.activeView).toBe('d2');

    // Icon theme should have been loaded once
    expect(getIconTheme).toHaveBeenCalledTimes(1);

    // Switching back to reactflow should not reload icon theme
    await act(async () => {
      await result.current.switchView('reactflow');
    });

    expect(getDiagramView).toHaveBeenCalledWith(123, 'reactflow');
    expect(getIconTheme).toHaveBeenCalledTimes(1);
  });
}); 