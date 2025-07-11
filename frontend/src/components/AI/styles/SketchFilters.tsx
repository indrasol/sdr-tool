import React from 'react';

/**
 * SVG Filters for Sketch Mode
 * Provides hand-drawn aesthetic with rough paper texture and line effects
 */
const SketchFilters: React.FC = () => (
  <svg width="0" height="0" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
    <defs>
      {/* Rough Paper Texture Filter */}
      <filter id="rough-paper" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence 
          baseFrequency="0.04" 
          numOctaves="3" 
          result="texture" 
          seed="1"
          type="fractalNoise"
        />
        <feDisplacementMap 
          in="SourceGraphic" 
          in2="texture" 
          scale="2"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      
      {/* Rough Line Effect */}
      <filter id="rough-line" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence 
          baseFrequency="0.02" 
          numOctaves="2" 
          result="roughness" 
          seed="2"
          type="fractalNoise"
        />
        <feDisplacementMap 
          in="SourceGraphic" 
          in2="roughness" 
          scale="1.5"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      
      {/* Hand-drawn Shadow */}
      <filter id="hand-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="shadow" in="SourceGraphic"/>
        <feOffset dx="2" dy="3" result="offsetShadow" in="shadow"/>
        <feFlood floodColor="rgba(0,0,0,0.3)" result="shadowColor"/>
        <feComposite in="shadowColor" in2="offsetShadow" operator="in" result="dropshadow"/>
        <feMerge>
          <feMergeNode in="dropshadow"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      {/* Pencil Stroke Effect */}
      <filter id="pencil-stroke" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence 
          baseFrequency="0.8" 
          numOctaves="4" 
          result="pencilTexture" 
          seed="3"
          type="fractalNoise"
        />
        <feColorMatrix 
          in="pencilTexture" 
          type="saturate" 
          values="0" 
          result="pencilGray"
        />
        <feComponentTransfer in="pencilGray" result="pencilContrast">
          <feFuncA type="discrete" tableValues="0 0.5 0.5 0.7 0.7 0.8 0.9 1"/>
        </feComponentTransfer>
        <feComposite 
          in="SourceGraphic" 
          in2="pencilContrast" 
          operator="multiply"
        />
      </filter>
      
      {/* Paper Texture Background */}
      <pattern id="paper-texture" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <rect width="100" height="100" fill="#fefefe"/>
        <circle cx="20" cy="20" r="1" fill="#f8f8f8" opacity="0.5"/>
        <circle cx="80" cy="40" r="0.5" fill="#f5f5f5" opacity="0.3"/>
        <circle cx="50" cy="70" r="0.8" fill="#f0f0f0" opacity="0.4"/>
        <circle cx="30" cy="85" r="0.6" fill="#f8f8f8" opacity="0.2"/>
        <circle cx="70" cy="15" r="0.4" fill="#f5f5f5" opacity="0.6"/>
      </pattern>
      
      {/* Sketch Border Effect */}
      <filter id="sketch-border" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence 
          baseFrequency="0.1" 
          numOctaves="2" 
          result="borderRoughness" 
          seed="4"
        />
        <feDisplacementMap 
          in="SourceGraphic" 
          in2="borderRoughness" 
          scale="1"
        />
        <feGaussianBlur stdDeviation="0.5" result="blur"/>
        <feComposite in="blur" in2="SourceGraphic" operator="over"/>
      </filter>
      
      {/* Watercolor Effect */}
      <filter id="watercolor" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence 
          baseFrequency="0.04" 
          numOctaves="3" 
          result="waterTexture" 
          seed="5"
        />
        <feDisplacementMap 
          in="SourceGraphic" 
          in2="waterTexture" 
          scale="3"
        />
        <feGaussianBlur stdDeviation="1" result="softened"/>
        <feComposite in="softened" in2="SourceGraphic" operator="multiply"/>
      </filter>
      
      {/* Ink Blot Effect */}
      <filter id="ink-blot" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence 
          baseFrequency="0.02" 
          numOctaves="1" 
          result="inkTexture" 
          seed="6"
        />
        <feDisplacementMap 
          in="SourceGraphic" 
          in2="inkTexture" 
          scale="4"
        />
        <feGaussianBlur stdDeviation="0.8" result="inkBlur"/>
        <feComposite in="inkBlur" in2="SourceGraphic" operator="multiply"/>
      </filter>
    </defs>
  </svg>
);

export default SketchFilters; 