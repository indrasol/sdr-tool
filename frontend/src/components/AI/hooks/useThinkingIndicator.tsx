
import { useState, useEffect, useCallback } from 'react';

// Sample thinking lines that will flow through the component
const thinkingLines = [
  "Analyzing request parameters...",
  "Parsing network requirements...",
  "Identifying security needs...",
  "Evaluating threat models...",
  "Checking for vulnerabilities...",
  "Considering compliance requirements...",
  "Drafting network topology...",
  "Optimizing security posture...",
  "Balancing security and usability...",
  "Finalizing architecture design...",
  "Applying security best practices...",
  "Implementing zero-trust principles...",
  "Validating compliance requirements...",
  "Analyzing potential attack vectors...",
  "Optimizing defense-in-depth strategy..."
];

export const useThinkingIndicator = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [progress, setProgress] = useState(5); // Start at 5%
  const [thinkingPhase, setThinkingPhase] = useState<string>("Analyzing request");
  const [visibleThinkingLines, setVisibleThinkingLines] = useState<string[]>([]);
  const [lineQueue, setLineQueue] = useState<string[]>([...thinkingLines]);
  const [startTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Reset the thinking animation
  const resetThinking = useCallback(() => {
    setProgress(5);
    setThinkingPhase("Analyzing request");
    setVisibleThinkingLines([]);
    setLineQueue([...thinkingLines]);
  }, []);

  // Toggle the open/closed state of the thinking indicator
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Simulate progress increasing over time
  useEffect(() => {
    const startTime = Date.now();
    const targetTime = 20000; // 20 seconds (reduced from 60 seconds)
    
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = Math.min((elapsedTime / targetTime) * 100, 95);
      setProgress(newProgress);
      
      // Calculate elapsed seconds
      setElapsedSeconds(Math.floor(elapsedTime / 1000));
      
      // Update thinking phase based on progress
      if (newProgress < 20) {
        setThinkingPhase("Analyzing request");
      } else if (newProgress < 40) {
        setThinkingPhase("Processing information");
      } else if (newProgress < 60) {
        setThinkingPhase("Generating solution");
      } else if (newProgress < 80) {
        setThinkingPhase("Refining response");
      } else {
        setThinkingPhase("Finalizing answer");
      }
      
      // If reached 95%, stay there until response is ready
      if (newProgress >= 95) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Effect to initialize and manage the flowing thinking lines
  useEffect(() => {
    // Initialize with first 3 lines if not already done
    if (visibleThinkingLines.length === 0) {
      const initialLines = lineQueue.slice(0, 3);
      setVisibleThinkingLines(initialLines);
      setLineQueue(prev => prev.slice(3));
    }
    
    // Setup interval to continuously flow thinking lines
    const lineInterval = setInterval(() => {
      // Remove the first (oldest) line
      setVisibleThinkingLines(prev => {
        if (prev.length === 0) return prev;
        return prev.slice(1);
      });
      
      // Get a new line from the queue or recycle from thinkingLines if queue is empty
      setLineQueue(prev => {
        if (prev.length === 0) {
          // Reset the queue if it's empty
          return [...thinkingLines.slice(1)];
        }
        return prev;
      });
      
      // Add the new line
      setVisibleThinkingLines(prev => {
        const nextLine = lineQueue.length > 0 ? lineQueue[0] : thinkingLines[0];
        setLineQueue(q => q.length > 0 ? q.slice(1) : [...thinkingLines.slice(1)]);
        return [...prev, nextLine].slice(0, 3); // Keep max 3 lines
      });
      
    }, 1200); // Flow a line every 1.2 seconds for a natural thinking effect

    return () => clearInterval(lineInterval);
  }, [lineQueue.length]);

  return {
    isOpen,
    setIsOpen,
    toggleOpen,
    progress,
    thinkingPhase,
    visibleThinkingLines,
    resetThinking,
    elapsedSeconds
  };
};