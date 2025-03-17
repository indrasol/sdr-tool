import { useState, useEffect, useRef } from 'react';

interface UseTypingEffectOptions {
  text: string;
  typingSpeed?: number;
  startDelay?: number;
  showCursor?: boolean;
}

/**
 * A simplified typewriter effect hook that focuses on stability
 */
export const useSimpleTypingEffect = ({
  text,
  typingSpeed = 40,
  startDelay = 500,
  showCursor = true
}: UseTypingEffectOptions) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  
  // Using refs to avoid dependencies in useEffect
  const hasStartedRef = useRef(false);
  const charIndexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textRef = useRef(text);
  
  // Update the text ref when text changes (without triggering effect re-runs)
  useEffect(() => {
    if (textRef.current !== text) {
      textRef.current = text;
      charIndexRef.current = 0;
      setDisplayedText('');
      setIsComplete(false);
      hasStartedRef.current = false;
      // Clear any existing timers
      if (timerRef.current) clearTimeout(timerRef.current);
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    }
  }, [text]);
  
  // Main effect for typing animation
  useEffect(() => {
    // Cleanup function for all timers
    const cleanup = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
    
    // Start typing after delay (only once)
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      timerRef.current = setTimeout(startTyping, startDelay);
      return cleanup;
    }
    
    function startTyping() {
      // If we've already typed the whole text, stop
      if (charIndexRef.current >= textRef.current.length) {
        setIsComplete(true);
        
        // If cursor is enabled, start blinking after completion
        if (showCursor) {
          let blinkCount = 0;
          const blinkCursor = () => {
            blinkTimerRef.current = setTimeout(() => {
              if (blinkCount < 4) { // 2 complete blinks
                setCursorVisible(prev => !prev);
                blinkCount++;
                blinkCursor();
              } else {
                setCursorVisible(false);
              }
            }, 500);
          };
          blinkCursor();
        }
        
        return;
      }
      
      // Type the next character
      charIndexRef.current++;
      setDisplayedText(textRef.current.substring(0, charIndexRef.current));
      
      // Schedule typing of next character
      timerRef.current = setTimeout(startTyping, typingSpeed);
    }
    
    return cleanup;
  }, []); // No dependencies means this runs only once
  
  // Create the cursor HTML
  const cursorHtml = showCursor && cursorVisible ? 
    `<span class="inline-flex ml-1 text-securetrack-purple"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-80"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg></span>` : 
    `<span class="inline-block w-0 h-0"></span>`;
  
  return {
    displayText: showCursor ? `${displayedText}${cursorHtml}` : displayedText,
    rawText: displayedText,
    isComplete
  };
};