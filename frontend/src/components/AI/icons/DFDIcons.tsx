import React from 'react';

/**
 * Earth Globe SVG component for Internet nodes
 */
export const EarthGlobeSVG: React.FC = () => {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="earthOutline" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#115e59" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      
      {/* Fill the entire circle with gradient background */}
      <circle cx="100" cy="100" r="100" fill="url(#globeGradient)" />
      
      {/* Main globe circle */}
      <circle cx="100" cy="100" r="95" fill="url(#globeGradient)" filter="url(#glow)" />
      <circle cx="100" cy="100" r="95" fill="none" stroke="url(#earthOutline)" strokeWidth="2" />
      
      {/* Grid lines */}
      <g stroke="#e0f2fe" strokeWidth="1.5" fill="none">
        <ellipse cx="100" cy="100" rx="95" ry="95" />
        <ellipse cx="100" cy="100" rx="95" ry="70" />
        <ellipse cx="100" cy="100" rx="95" ry="45" />
        <line x1="5" y1="100" x2="195" y2="100" />
        <line x1="100" y1="5" x2="100" y2="195" />
      </g>
    </svg>
  );
};

/**
 * CDN Icon SVG component for Content Delivery Network nodes
 */
export const CDNIconSVG: React.FC = () => {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="cdnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="cdnGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        {/* Animation definitions */}
        <circle id="dataDot" r="6" fill="white" />
        
        {/* Animation paths */}
        <path id="path1" d="M100,100 L45,45" stroke="transparent" fill="none" />
        <path id="path2" d="M100,100 L155,45" stroke="transparent" fill="none" />
        <path id="path3" d="M100,100 L45,155" stroke="transparent" fill="none" />
        <path id="path4" d="M100,100 L155,155" stroke="transparent" fill="none" />
      </defs>
      
      {/* Fill the entire circle with gradient background */}
      <circle cx="100" cy="100" r="100" fill="url(#cdnGradient)" />
      
      {/* Main CDN circle */}
      <circle cx="100" cy="100" r="95" fill="url(#cdnGradient)" filter="url(#cdnGlow)" />
      
      {/* CDN Network visualization */}
      {/* Central node (origin server) */}
      <circle cx="100" cy="100" r="28" fill="rgba(255,255,255,0.8)" />
      
      {/* Server rack lines inside central node */}
      <rect x="85" y="82" width="30" height="5" fill="rgba(0,0,0,0.3)" />
      <rect x="85" y="92" width="30" height="5" fill="rgba(0,0,0,0.3)" />
      <rect x="85" y="102" width="30" height="5" fill="rgba(0,0,0,0.3)" />
      <rect x="85" y="112" width="30" height="5" fill="rgba(0,0,0,0.3)" />
      
      {/* Edge nodes (CDN servers) */}
      <circle cx="45" cy="45" r="16" fill="rgba(255,255,255,0.7)" />
      <circle cx="155" cy="45" r="16" fill="rgba(255,255,255,0.7)" />
      <circle cx="45" cy="155" r="16" fill="rgba(255,255,255,0.7)" />
      <circle cx="155" cy="155" r="16" fill="rgba(255,255,255,0.7)" />
      
      {/* Connection lines */}
      <line x1="100" y1="100" x2="45" y2="45" stroke="rgba(255,255,255,0.5)" strokeWidth="4" />
      <line x1="100" y1="100" x2="155" y2="45" stroke="rgba(255,255,255,0.5)" strokeWidth="4" />
      <line x1="100" y1="100" x2="45" y2="155" stroke="rgba(255,255,255,0.5)" strokeWidth="4" />
      <line x1="100" y1="100" x2="155" y2="155" stroke="rgba(255,255,255,0.5)" strokeWidth="4" />
      
      {/* Data packets for animation */}
      <circle cx="72" cy="72" r="6" fill="white" opacity="0.9">
        <animate attributeName="cx" from="100" to="45" dur="3s" repeatCount="indefinite" />
        <animate attributeName="cy" from="100" to="45" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
      </circle>
      
      <circle cx="127" cy="72" r="6" fill="white" opacity="0.9">
        <animate attributeName="cx" from="100" to="155" dur="3s" begin="0.5s" repeatCount="indefinite" />
        <animate attributeName="cy" from="100" to="45" dur="3s" begin="0.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="3s" begin="0.5s" repeatCount="indefinite" />
      </circle>
      
      <circle cx="72" cy="127" r="6" fill="white" opacity="0.9">
        <animate attributeName="cx" from="100" to="45" dur="3s" begin="1s" repeatCount="indefinite" />
        <animate attributeName="cy" from="100" to="155" dur="3s" begin="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1s" repeatCount="indefinite" />
      </circle>
      
      <circle cx="127" cy="127" r="6" fill="white" opacity="0.9">
        <animate attributeName="cx" from="100" to="155" dur="3s" begin="1.5s" repeatCount="indefinite" />
        <animate attributeName="cy" from="100" to="155" dur="3s" begin="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1.5s" repeatCount="indefinite" />
      </circle>
      
      {/* Reflection highlight */}
      <path d="M70,40 L130,40 Q140,70 130,100 L70,100 Q60,70 70,40 Z" 
            fill="white" opacity="0.1" />
    </svg>
  );
};

// Export additional SVG icon components as needed
// This file serves as a central repository for all DFD-related SVG icons 