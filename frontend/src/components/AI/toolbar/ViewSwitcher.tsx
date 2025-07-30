import React, { useEffect } from 'react';

interface ViewSwitcherProps {
  /** All available views as reported by the back-end (e.g. ["reactflow","d2","c4ctx"]. */
  views: string[];
  /** Currently active view identifier. */
  activeView: string;
  /** Invoked when the user selects a different view. */
  onSwitch: (view: string) => void;
}

/**
 * UI control allowing the user to switch between multiple diagram renderings
 * (ReactFlow, D2, C4 Context …).  It gracefully de-grades to a disabled state
 * if only a single view is available.
 */
const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ views, activeView, onSwitch }) => {
  useEffect(() => {
    // Add debug logging
    console.log('ViewSwitcher rendered with views:', views);
    console.log('ViewSwitcher active view:', activeView);
  }, [views, activeView]);

  // No alternative views → render placeholder disabled select
  if (!views || views.length <= 1) {
    console.log('ViewSwitcher: Not enough views to show switcher');
    return (
      <select
        disabled
        className="border rounded px-2 py-1 text-sm text-gray-500 bg-gray-100 cursor-not-allowed"
        value={activeView}
        onChange={() => {}}
      >
        <option value={activeView}>{activeView}</option>
      </select>
    );
  }

  console.log('ViewSwitcher: Showing switcher with multiple views');
  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      value={activeView}
      onChange={(e) => onSwitch(e.target.value)}
    >
      {views.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
};

export default ViewSwitcher; 