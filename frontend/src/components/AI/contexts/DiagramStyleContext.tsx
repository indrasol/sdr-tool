import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Define diagram style types
export type DiagramStyle = 'professional' | 'sketch' | 'minimal';

export interface StyleConfig {
  nodeStyle: {
    borderRadius: string;
    borderWidth: string;
    borderStyle: string;
    backgroundColor: string;
    backgroundColorDark: string; // Add dark mode background
    filter: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    textColor: string; // Add text color
    textColorDark: string; // Add dark mode text color
  };
  edgeStyle: {
    strokeWidth: string;
    strokeDasharray: string;
    filter: string;
    strokeColor: string; // Add stroke color
    strokeColorDark: string; // Add dark mode stroke color
  };
}

export const diagramStyles: Record<DiagramStyle, StyleConfig> = {
  professional: {
    nodeStyle: {
      borderRadius: '8px',
      borderWidth: '2px',
      borderStyle: 'solid',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backgroundColorDark: 'rgba(0, 0, 0, 0.9)',
      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      textColor: '#333',
      textColorDark: '#fff',
    },
    edgeStyle: {
      strokeWidth: '2px',
      strokeDasharray: 'none',
      filter: 'none',
      strokeColor: '#333',
      strokeColorDark: '#fff',
    },
  },
  sketch: {
    nodeStyle: {
      borderRadius: '12px',
      borderWidth: '3px',
      borderStyle: 'solid',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backgroundColorDark: 'rgba(0, 0, 0, 0.95)',
      filter: 'url(#rough-paper) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15))',
      fontFamily: 'Kalam, cursive',
      fontSize: '14px',
      fontWeight: '400',
      textColor: '#333',
      textColorDark: '#fff',
    },
    edgeStyle: {
      strokeWidth: '2.5px',
      strokeDasharray: '5,3',
      filter: 'url(#rough-line)',
      strokeColor: '#333',
      strokeColorDark: '#fff',
    },
  },
  minimal: {
    nodeStyle: {
      borderRadius: '4px',
      borderWidth: '1px',
      borderStyle: 'solid',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backgroundColorDark: 'rgba(0, 0, 0, 0.8)',
      filter: 'none',
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      fontWeight: '400',
      textColor: '#333',
      textColorDark: '#fff',
    },
    edgeStyle: {
      strokeWidth: '1px',
      strokeDasharray: 'none',
      filter: 'none',
      strokeColor: '#333',
      strokeColorDark: '#fff',
    },
  },
};

interface DiagramStyleContextType {
  diagramStyle: DiagramStyle;
  setDiagramStyle: (style: DiagramStyle) => void;
  styleConfig: StyleConfig;
}

const DiagramStyleContext = createContext<DiagramStyleContextType | undefined>(undefined);

interface DiagramStyleProviderProps {
  children: ReactNode;
}

export const DiagramStyleProvider: React.FC<DiagramStyleProviderProps> = ({ children }) => {
  const [diagramStyle, setDiagramStyle] = useState<DiagramStyle>('professional');
  const { theme } = useTheme();

  // Get style config for current diagram style
  const styleConfig = diagramStyles[diagramStyle];

  // Apply global styles when diagram style or theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply CSS custom properties with theme awareness
    root.style.setProperty('--node-border-radius', styleConfig.nodeStyle.borderRadius);
    root.style.setProperty('--node-border-width', styleConfig.nodeStyle.borderWidth);
    root.style.setProperty('--node-font-family', styleConfig.nodeStyle.fontFamily);
    root.style.setProperty('--node-font-size', styleConfig.nodeStyle.fontSize);
    root.style.setProperty('--edge-stroke-width', styleConfig.edgeStyle.strokeWidth);
    
    // Apply theme-aware colors
    const nodeBackground = theme === 'dark' 
      ? styleConfig.nodeStyle.backgroundColorDark 
      : styleConfig.nodeStyle.backgroundColor;
    const textColor = theme === 'dark'
      ? styleConfig.nodeStyle.textColorDark
      : styleConfig.nodeStyle.textColor;
    const strokeColor = theme === 'dark'
      ? styleConfig.edgeStyle.strokeColorDark
      : styleConfig.edgeStyle.strokeColor;
    
    root.style.setProperty('--node-background-color', nodeBackground);
    root.style.setProperty('--node-text-color', textColor);
    root.style.setProperty('--edge-stroke-color', strokeColor);
    
    // Load Google Fonts for sketch mode
    if (diagramStyle === 'sketch') {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap';
      link.rel = 'stylesheet';
      if (!document.head.querySelector(`link[href="${link.href}"]`)) {
        document.head.appendChild(link);
      }
    }
  }, [diagramStyle, styleConfig, theme]);

  const value = {
    diagramStyle,
    setDiagramStyle,
    styleConfig,
  };

  return (
    <DiagramStyleContext.Provider value={value}>
      {children}
    </DiagramStyleContext.Provider>
  );
};

export const useDiagramStyle = (): DiagramStyleContextType => {
  const context = useContext(DiagramStyleContext);
  if (!context) {
    throw new Error('useDiagramStyle must be used within a DiagramStyleProvider');
  }
  return context;
};

// Hook for responsive icon sizing
export const useResponsiveIconSize = (): number => {
  const [iconSize, setIconSize] = useState(32);
  
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 768) setIconSize(24);      // Mobile
      else if (width < 1024) setIconSize(28); // Tablet
      else setIconSize(32);                    // Desktop
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return iconSize;
}; 