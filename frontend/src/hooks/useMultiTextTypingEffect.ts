import { useState, useEffect, useRef } from 'react';

interface UseMultiTextTypingEffectOptions {
  texts: string[];
  typingSpeed?: number;
  pauseAtEnd?: number;
  pauseAtStart?: number;
  deleteSpeed?: number;
  blinkCursor?: boolean;
  useBotCursor?: boolean;
}

/**
 * A hook that provides a continuous typing effect cycling through multiple texts
 * It will type a text, pause, delete it, and then type the next text
 */
export const useMultiTextTypingEffect = ({
  texts = [],
  typingSpeed = 60,
  pauseAtEnd = 2000, 
  pauseAtStart = 800,
  deleteSpeed = 50, 
  blinkCursor = true,
  useBotCursor = false
}: UseMultiTextTypingEffectOptions) => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  // Use a single state to track the current phase
  const phaseRef = useRef<'typing' | 'pausing' | 'deleting'>('typing');
  const currentTextIndex = useRef(0);
  const currentPosition = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const textsRef = useRef(texts);

  // Update texts ref if the array changes
  useEffect(() => {
    textsRef.current = texts;
    // Reset state when texts change
    currentTextIndex.current = 0;
    currentPosition.current = 0;
    phaseRef.current = 'typing';
    setDisplayText('');
  }, [texts]);

  // Setup cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Cursor blinking effect
  useEffect(() => {
    if (!blinkCursor) return;

    const blinkInterval = setInterval(() => {
      if (isMounted.current) {
        setShowCursor(prev => !prev);
      }
    }, 500);

    return () => clearInterval(blinkInterval);
  }, [blinkCursor]);

  // Main animation effect
  useEffect(() => {
    const animate = () => {
      if (!isMounted.current) return;

      const currentText = textsRef.current[currentTextIndex.current];
      if (!currentText) return;

      switch (phaseRef.current) {
        case 'typing':
          if (currentPosition.current < currentText.length) {
            currentPosition.current++;
            setDisplayText(currentText.substring(0, currentPosition.current));
            timeoutRef.current = setTimeout(animate, typingSpeed);
          } else {
            phaseRef.current = 'pausing';
            timeoutRef.current = setTimeout(animate, pauseAtEnd);
          }
          break;

        case 'pausing':
          if (currentPosition.current === currentText.length) {
            // Pause after typing complete, start deleting
            phaseRef.current = 'deleting';
          } else {
            // Pause after deleting complete, move to next text
            currentTextIndex.current = (currentTextIndex.current + 1) % textsRef.current.length;
            currentPosition.current = 0;
            phaseRef.current = 'typing';
          }
          timeoutRef.current = setTimeout(animate, 10);
          break;

        case 'deleting':
          if (currentPosition.current > 0) {
            currentPosition.current--;
            setDisplayText(currentText.substring(0, currentPosition.current));
            timeoutRef.current = setTimeout(animate, deleteSpeed);
          } else {
            // Finished deleting, pause before next text
            phaseRef.current = 'pausing';
            timeoutRef.current = setTimeout(animate, pauseAtStart);
          }
          break;
      }
    };

    // Start the animation
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(animate, 10);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [typingSpeed, deleteSpeed, pauseAtEnd, pauseAtStart]);

  // Prepare the full display text with cursor
  const cursorSpan = showCursor ? 
    (useBotCursor ? 
      '<span class="bot-cursor"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg></span>' : 
      '<span class="typing-cursor">|</span>'
    ) : '';

  return {
    displayText: `${displayText}${cursorSpan}`,
    rawText: displayText,
    isTyping: phaseRef.current === 'typing',
    isDeleting: phaseRef.current === 'deleting',
    isPaused: phaseRef.current === 'pausing',
    currentTextIndex: currentTextIndex.current
  };
}; 