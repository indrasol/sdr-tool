import React from 'react';
import { convertGCPIconsToToolbarItems } from './GCPIconsLoader';

const GCPIconsTest: React.FC = () => {
  const gcpIcons = convertGCPIconsToToolbarItems();
  
  // Just display the first few icons to test
  const testIcons = gcpIcons.slice(0, 10);
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">GCP Icons Test</h2>
      
      <div className="grid grid-cols-5 gap-4">
        {testIcons.map((icon, index) => {
          const IconComponent = icon.icon;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <IconComponent />
              </div>
              <span className="text-xs text-center mt-1">{icon.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GCPIconsTest; 