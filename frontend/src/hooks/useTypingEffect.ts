import { useState, useEffect, useRef } from 'react';

interface UseTypingEffectOptions {
  text: string;
  typingSpeed?: number;
  blinkCursor?: boolean;
  shouldType?: boolean;
}

export const useTypingEffect = ({
  text = '',
  typingSpeed = 5,
  blinkCursor = true,
  shouldType = true
}: UseTypingEffectOptions) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  // Track if the hook is mounted to avoid state updates after unmount
  const isMounted = useRef(true);
  // Track current position in text
  const currentPosition = useRef(0);
  // Track last update time for performance optimization
  const lastUpdateTime = useRef(Date.now());
  // Store the text to be typed to avoid rerenders changing it mid-typing
  const textToType = useRef(text);
  
  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Update the text to type if it changes
  useEffect(() => {
    textToType.current = text;
    // Reset state when text changes
    setDisplayText('');
    setIsComplete(false);
    currentPosition.current = 0;
    lastUpdateTime.current = Date.now();
  }, [text]);
  
  // Handle the typing animation
  useEffect(() => {
    // If we shouldn't animate or no text, just show the full text immediately
    if (!shouldType || !textToType.current) {
      setDisplayText(textToType.current);
      setIsComplete(true);
      return;
    }
    
    // If we've typed everything, mark as complete
    if (currentPosition.current >= textToType.current.length) {
      if (!isComplete) {
        setIsComplete(true);
      }
      return;
    }
    
    // Function to perform typing animation
    const performTyping = () => {
      if (!isMounted.current) return;
      
      const now = Date.now();
      const elapsed = now - lastUpdateTime.current;
      
      // Only update if enough time has passed based on typing speed
      if (elapsed >= typingSpeed) {
        // Calculate how many characters to type
        // We want Claude-like typing - not too fast, not too slow
        const baseChars = Math.max(1, Math.floor(elapsed / typingSpeed));
        
        // Type faster for longer content but preserve the Claude-like rhythm
        // Logarithmic scaling to handle very long content
        const lengthFactor = Math.log10(Math.max(10, textToType.current.length / 100));
        const charsToType = Math.min(5, Math.max(1, Math.round(baseChars * lengthFactor * 0.5)));
        
        // Slow down typing near paragraph and line endings to emulate natural pausing
        const lookAhead = textToType.current.substring(
          currentPosition.current, 
          currentPosition.current + 20
        );
        
        // If we're approaching a paragraph or line break, type slower
        const nearBreak = /[.!?]\s|\n/.test(lookAhead.substring(0, 3));
        const actualCharsToType = nearBreak ? 1 : charsToType;
        
        // Calculate new position, ensuring we don't go beyond text length
        let newPosition = Math.min(
          textToType.current.length, 
          currentPosition.current + actualCharsToType
        );
        
        // Special handling for newlines and punctuation to create natural pauses
        if (nearBreak && newPosition < textToType.current.length) {
          // Find the next break point
          const nextBreak = textToType.current.substring(newPosition).search(/[.!?]\s|\n/);
          if (nextBreak > -1 && nextBreak < 10) {
            // Include the break point in this chunk to create a natural pause
            newPosition = newPosition + nextBreak + 1;
          }
        }
        
        // Add the next characters
        setDisplayText(textToType.current.substring(0, newPosition));
        
        // Update position and timestamp
        currentPosition.current = newPosition;
        lastUpdateTime.current = now;
        
        // Add delays near paragraph endings to simulate natural pausing
        if (textToType.current.charAt(newPosition - 1) === '\n' || 
            /[.!?]\s/.test(textToType.current.substring(newPosition - 2, newPosition))) {
          // Add extra delay after paragraph or sentence endings
          lastUpdateTime.current = now - (typingSpeed * 0.5);
        }
      }
      
      // Continue animation if not complete
      if (currentPosition.current < textToType.current.length) {
        requestAnimationFrame(performTyping);
      } else {
        setIsComplete(true);
      }
    };
    
    // Start typing animation
    const animationFrame = requestAnimationFrame(performTyping);
    return () => cancelAnimationFrame(animationFrame);
  }, [shouldType, isComplete, typingSpeed]);

  return {
    displayText: displayText,
    rawText: displayText, // Pure text without any HTML
    isComplete,
    progress: textToType.current ? currentPosition.current / textToType.current.length : 1
  };
};