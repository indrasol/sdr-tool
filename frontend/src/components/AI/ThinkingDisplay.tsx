// src/components/AI/ThinkingDisplay.tsx
import React, { useState } from 'react';
// import './ThinkingDisplay.css'

interface ThinkingDisplayProps {
  thinking?: string;
  hasRedactedThinking?: boolean;
}

const ThinkingDisplay: React.FC<ThinkingDisplayProps> = ({ thinking, hasRedactedThinking }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thinking) {
    return null;
  }

  return (
    <div className="thinking-container">
      <button 
        className={`thinking-toggle ${isExpanded ? 'expanded' : 'collapsed'}`} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Hide thinking' : 'Show thinking'}
        <svg 
          className={`toggle-icon ${isExpanded ? 'expanded' : ''}`} 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isExpanded && (
        <div className="thinking-content">
          <div className="thinking-header">
            <div className="thinking-title">Guardian AI's thinking</div>
            {hasRedactedThinking && (
              <div className="redacted-notice">
                Some thinking content was redacted for safety reasons
              </div>
            )}
          </div>
          <div className="thinking-text">
            {thinking.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
        </div>
      )}    
    </div>
  );
};

export default ThinkingDisplay;