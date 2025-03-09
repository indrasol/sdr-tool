import { useState, useEffect } from 'react';

interface UseTypingEffectOptions {
  texts: string[];
  typingSpeed?: number;
  pauseAtEnd?: number;
  pauseAtStart?: number;
  blinkCursor?: boolean;
}

/**
 * Custom hook for creating a typewriter effect.
 */
export const useTypingEffect = ({
  texts,
  typingSpeed = 100,
  pauseAtEnd = 2000,
  pauseAtStart = 700,
  blinkCursor = true,
}: UseTypingEffectOptions) => {
  const [displayText, setDisplayText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isTypingForward, setIsTypingForward] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [blinkTimeout, setBlinkTimeout] = useState<NodeJS.Timeout | null>(null);

  // Blinking cursor effect
  useEffect(() => {
    if (!blinkCursor) return;
    
    let cursorInterval: NodeJS.Timeout;
    
    if (isComplete) {
      // If typing is complete, blink exactly 2 times then hide cursor
      if (blinkCount < 4) { // 4 state changes = 2 complete blinks (on->off->on->off)
        const blinkTimer = setTimeout(() => {
          setShowCursor(prev => !prev);
          setBlinkCount(prev => prev + 1);
        }, 500);
        
        setBlinkTimeout(blinkTimer);
        return () => clearTimeout(blinkTimer);
      } else {
        setShowCursor(false);
      }
    } else {
      // During typing, keep cursor visible without blinking
      setShowCursor(true);
    }
    
    return () => {
      if (cursorInterval) clearInterval(cursorInterval);
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, [blinkCursor, isComplete, blinkCount, blinkTimeout]);

  useEffect(() => {
    if (!texts || texts.length === 0) return;

    // For single text with no loop, just type it out once
    const isSingleUse = texts.length === 1 && pauseAtEnd === 0;
    
    const timer = setTimeout(() => {
      const currentFullText = texts[currentTextIndex];

      if (isTypingForward) {
        // Typing forward
        if (charIndex < currentFullText.length) {
          setDisplayText(currentFullText.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Reached the end
          if (isSingleUse) {
            setIsComplete(true);
            setBlinkCount(0); // Reset blink count to start the final 2 blinks
            return;
          }
          
          // Pause before starting to delete
          setIsTypingForward(false);
          return pauseAtEnd;
        }
      } else {
        // Deleting
        if (charIndex > 0) {
          setDisplayText(currentFullText.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          // Fully deleted, move to the next text
          setIsTypingForward(true);
          setCurrentTextIndex((currentTextIndex + 1) % texts.length);
          return pauseAtStart;
        }
      }
    }, isTypingForward ? typingSpeed : typingSpeed / 2);
    
    return () => clearTimeout(timer);
  }, [
    charIndex, 
    currentTextIndex, 
    isTypingForward, 
    texts, 
    typingSpeed, 
    pauseAtEnd, 
    pauseAtStart
  ]);

  // Return only the raw text without any HTML, useful for places where we don't want HTML tags
  const rawText = displayText;

  // Create the AI icon cursor HTML
  const cursorHtml = showCursor && blinkCursor ? 
    `<span class="inline-flex ml-1 text-securetrack-purple"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-80"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg></span>` : 
    `<span class="inline-block w-0 h-0"></span>`;

  return { 
    displayText: blinkCursor ? `${displayText}${cursorHtml}` : displayText,
    rawText, // This is the pure text without any HTML
    isComplete
  };
};