import React from 'react';

const StackedRings: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      width="200" 
      height="250" 
      viewBox="0 0 200 250" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Backdrop gradient */}
        <radialGradient id="backdropGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        
        {/* Gradients for each ring */}
        <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F9CF9" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4F9CF9" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="mintGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ED8B8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4ED8B8" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A9D86E" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#A9D86E" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="lightBlueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#49B3E6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#49B3E6" stopOpacity="0.4" />
        </linearGradient>
        
        {/* Mask for cutting out inner circles */}
        <mask id="hollowRing1">
          <rect x="0" y="0" width="200" height="250" fill="white" />
          <ellipse cx="100" cy="190" rx="55" ry="20" fill="black" />
        </mask>
        
        <mask id="hollowRing2">
          <rect x="0" y="0" width="200" height="250" fill="white" />
          <ellipse cx="100" cy="140" rx="45" ry="16" fill="black" />
        </mask>
        
        <mask id="hollowRing3">
          <rect x="0" y="0" width="200" height="250" fill="white" />
          <ellipse cx="100" cy="100" rx="35" ry="14" fill="black" />
        </mask>
        
        <mask id="hollowRing4">
          <rect x="0" y="0" width="200" height="250" fill="white" />
          <ellipse cx="100" cy="70" rx="25" ry="10" fill="black" />
        </mask>
      </defs>
      
      {/* Subtle backdrop */}
      <ellipse 
        cx="100" 
        cy="130" 
        rx="100" 
        ry="100" 
        fill="url(#backdropGradient)" 
      />
      
      {/* Bottom largest ring (light blue) */}
      <ellipse 
        cx="100" 
        cy="190" 
        rx="80" 
        ry="30" 
        stroke="#4F9CF9" 
        strokeWidth="1.75" 
        fill="url(#blueGradient)"
        mask="url(#hollowRing1)" 
      />
      
      {/* Third ring (mint green) */}
      <ellipse 
        cx="100" 
        cy="140" 
        rx="65" 
        ry="25" 
        stroke="#4ED8B8" 
        strokeWidth="1.75" 
        fill="url(#mintGradient)"
        mask="url(#hollowRing2)" 
      />
      
      {/* Second ring (light yellow/green) */}
      <ellipse 
        cx="100" 
        cy="100" 
        rx="50" 
        ry="20" 
        stroke="#A9D86E" 
        strokeWidth="1.75" 
        fill="url(#greenGradient)"
        mask="url(#hollowRing3)" 
      />
      
      {/* Top smallest ring (light blue) */}
      <ellipse 
        cx="100" 
        cy="70" 
        rx="35" 
        ry="15" 
        stroke="#49B3E6" 
        strokeWidth="1.75" 
        fill="url(#lightBlueGradient)"
        mask="url(#hollowRing4)" 
      />
    </svg>
  );
};

export default StackedRings; 