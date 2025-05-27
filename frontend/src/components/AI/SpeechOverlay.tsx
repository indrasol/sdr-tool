import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Check, RefreshCw } from 'lucide-react';

// Use TypeScript declarations from the web-speech-api.d.ts file instead
// No need for the declare global section anymore

interface SpeechOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptComplete: (transcript: string) => void;
}

const SpeechOverlay: React.FC<SpeechOverlayProps> = ({ 
  isOpen, 
  onClose, 
  onTranscriptComplete 
}) => {
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset transcript whenever the overlay is opened
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setError(null);
    }
  }, [isOpen]);

  // Function to restart speech recognition
  const restartSpeechRecognition = () => {
    // Clear previous transcript
    setTranscript('');
    
    // Stop current recognition if running
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Short delay before restarting
    setTimeout(() => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
          setError(null);
        }
      } catch (err) {
        setError('Unable to restart speech recognition.');
        console.error('Speech recognition restart error:', err);
      }
    }, 300);
  };

  // Initialize speech recognition
  useEffect(() => {
    if (!isOpen) return;

    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }

    // Initialize the SpeechRecognition object
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    
    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      // Start listening
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        setError('Failed to start speech recognition.');
        console.error('Speech recognition error:', err);
      }

      // Event handlers
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        // Convert technical error messages to user-friendly ones
        if (event.error === 'no-speech') {
          setError('We didn\'t hear anything. Please try speaking again.');
        } else if (event.error === 'aborted') {
          setError('Listening was interrupted. Please try again.');
        } else if (event.error === 'network') {
          setError('Network issue detected. Please check your connection.');
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone access is blocked. Please allow microphone access and try again.');
        } else {
          setError(`Something went wrong with speech recognition. Please try again.`);
        }
        
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    };
  }, [isOpen]);

  // Handle closing the overlay without processing transcript
  const handleCancel = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    onClose();
  };
  
  // Handle confirming the transcript
  const handleConfirm = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (transcript.trim()) {
      onTranscriptComplete(transcript.trim());
    }
    
    onClose();
  };

  // Handle closing the overlay when clicking outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  // Determine if we're in the review state (transcript available but not listening)
  const isReviewingTranscript = transcript && !isListening && !error;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-[1000] flex items-center justify-center"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            backdropFilter: 'blur(8px)',
            position: 'absolute',
            top: '48px',
            left: '0',
            right: '0',
            bottom: '70px'
          }}
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ scale: 0.9, y: 0 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-lg border border-white/20"
            style={{ 
              width: '90%',
              maxWidth: '400px',
              height: 'auto',
              minHeight: '380px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 z-10 transition-colors duration-200"
              aria-label="Close"
            >
              <X size={20} className="stroke-2" />
            </button>

            {/* Enhanced animated gradient background with theme colors */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#7c65f6]/20 via-[#6366f1]/20 to-[#4f46e5]/20" 
              style={{
                backgroundSize: '400% 400%',
                animation: 'gradient-animation 12s ease infinite'
              }}
            />

            <div className="relative p-6 flex flex-col items-center justify-center w-full">
              {/* Enhanced microphone animation container */}
              <div className="mb-8 relative flex justify-center items-center w-full">
                <div className="relative flex items-center justify-center" style={{ width: '140px', height: '140px' }}>
                  {/* Dynamic pulse rings animation */}
                  {isListening && (
                    <>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.6, 1],
                          opacity: [0.4, 0, 0.4] 
                        }}
                        transition={{ 
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut" 
                        }}
                        className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-[#7c65f6]/30 to-[#6366f1]/30"
                        style={{ filter: "blur(1px)" }}
                      />
                      <motion.div
                        animate={{ 
                          scale: [1, 2.2, 1],
                          opacity: [0.3, 0, 0.3] 
                        }}
                        transition={{ 
                          duration: 3,
                          delay: 0.2,
                          repeat: Infinity,
                          ease: "easeInOut" 
                        }}
                        className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-[#4f46e5]/20 to-[#7c65f6]/20"
                        style={{ filter: "blur(0.5px)" }}
                      />
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [0.7, 0.3, 0.7] 
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut" 
                        }}
                        className="absolute w-12 h-12 rounded-full bg-gradient-to-r from-[#6366f1]/40 to-[#7c65f6]/40"
                      />
                    </>
                  )}
                  
                  {/* Enhanced microphone icon with additional animations */}
                  <motion.div 
                    animate={{ 
                      scale: isListening ? [1, 1.1, 1] : 1,
                      rotate: isListening ? [-2, 2, -2] : 0
                    }}
                    transition={{ 
                      duration: 1.2,
                      repeat: isListening ? Infinity : 0,
                      ease: "easeInOut" 
                    }}
                    className="relative z-10 bg-gradient-to-br from-[#6366f1] to-[#7c65f6] text-white p-5 rounded-full shadow-lg shadow-[#7c65f6]/20 border border-[#6366f1]/30"
                  >
                    {/* Sound wave effect inside the microphone button */}
                    {isListening && (
                      <motion.div
                        className="absolute inset-0 rounded-full overflow-hidden"
                        style={{ mixBlendMode: "soft-light" }}
                      >
                        <motion.div
                          className="absolute inset-0 opacity-40"
                          style={{
                            background: "radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 70%)",
                          }}
                          animate={{
                            scale: [1, 1.5, 1],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut",
                          }}
                        />
                        
                        {/* Circular sound wave effect */}
                        {Array.from({ length: 3 }).map((_, i) => (
                          <motion.div
                            key={`wave-${i}`}
                            className="absolute inset-0 rounded-full border-2 border-white/30"
                            animate={{
                              scale: [0, 1],
                              opacity: [0.7, 0],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: i * 0.4,
                              ease: "easeOut",
                            }}
                          />
                        ))}
                      </motion.div>
                    )}
                    
                    {/* Mic icon with pulsing effect */}
                    <motion.div
                      animate={isListening ? {
                        opacity: [0.8, 1, 0.8],
                      } : {}}
                      transition={{
                        duration: 1.5,
                        repeat: isListening ? Infinity : 0,
                        ease: "easeInOut",
                      }}
                    >
                      <Mic size={26} />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Enhanced audio waveform visualization - moved outside the previous container */}
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center space-x-0.5 h-10">
                  {isListening && (
                    <>
                      {Array.from({ length: 16 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            height: [`${Math.random() * 20 + 10}%`, `${Math.random() * 100}%`, `${Math.random() * 20 + 10}%`]
                          }}
                          transition={{ 
                            duration: Math.random() * 0.4 + 0.3,
                            repeat: Infinity,
                            repeatType: "mirror",
                            ease: "easeInOut",
                            delay: i * 0.03
                          }}
                          className={`w-1.5 rounded-full ${i % 3 === 0 ? 'bg-gradient-to-t from-[#6366f1] to-[#818cf8]' : 
                                      i % 3 === 1 ? 'bg-gradient-to-t from-[#7c65f6] to-[#a78bfa]' : 
                                      'bg-gradient-to-t from-[#4f46e5] to-[#6366f1]'}`}
                          style={{
                            filter: "drop-shadow(0 0 2px rgba(99, 102, 241, 0.6))"
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Status indicator - show appropriate message based on state */}
              {!error && (
                <motion.div
                  animate={isListening ? 
                    { opacity: [0.7, 1, 0.7], scale: [0.98, 1, 0.98] } : 
                    { opacity: 1 }
                  }
                  transition={{ duration: 2, repeat: isListening ? Infinity : 0 }}
                  className="mb-5 text-center flex flex-col items-center"
                >
                  {isListening ? (
                    <span className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2 bg-[#7c65f6]/10 text-[#7c65f6]">
                      <motion.span 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-[#7c65f6] inline-block"
                      />
                      Listening...
                    </span>
                  ) : isReviewingTranscript ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium text-[#6366f1] bg-[#6366f1]/10">
                        Does this look right?
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={restartSpeechRecognition}
                          className="p-1.5 rounded-full bg-white/80 border border-gray-200 text-[#6366f1] hover:text-[#4f46e5] hover:bg-[#6366f1]/5 shadow-sm transition-all duration-200 flex items-center justify-center"
                          aria-label="Try again"
                        >
                          <RefreshCw size={14} />
                        </motion.button>
                        <span className="text-xs text-gray-500">Try again</span>
                      </div>
                    </div>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2 bg-[#6366f1]/10 text-[#6366f1]">
                      Processing...
                    </span>
                  )}
                </motion.div>
              )}

              {/* Error message with enhanced styling */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm mb-8 text-center px-4 py-3 rounded-lg shadow-sm flex flex-col items-center gap-2 bg-gradient-to-br from-red-50/90 to-orange-50/70 backdrop-blur-sm border border-red-100"
                >
                  <span className="text-red-600 font-medium">{error}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={restartSpeechRecognition}
                    className="px-3 py-1.5 mt-1 rounded-lg bg-white/90 border border-red-100 text-red-500 hover:bg-red-50/50 shadow-sm text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={12} />
                    Try Again
                  </motion.button>
                </motion.div>
              )}

              {/* Enhanced transcript display - only show when no error */}
              {!error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full relative group"
                >
                  {/* Modern transcript display with backdrop blur and animated focus states */}
                  <div className="relative rounded-xl overflow-hidden">
                    {/* Background gradient with blur effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm"></div>
                    
                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-xl border border-[#6366f1]/20 group-hover:border-[#6366f1]/30 transition-colors duration-300"></div>
                    
                    {/* Content with inner shadow */}
                    <div className="relative p-4 min-h-[60px] max-h-[80px] overflow-y-auto shadow-inner">
                      {transcript ? (
                        <p className="text-gray-700 font-medium tracking-wide">
                          {transcript}
                        </p>
                      ) : (
                        <p className="text-gray-400 italic text-center font-light">
                          {isListening ? "Speak now..." : ""}
                        </p>
                      )}
                    </div>
                    
                    {/* Subtle highlight effect on top */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-white/70"></div>
                  </div>
                </motion.div>
              )}

              {/* Modern confirm/cancel buttons - replacing the instruction text */}
              <div className="flex gap-4 mt-6 w-full justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium border border-gray-200 text-gray-600 shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all duration-200"
                  onClick={handleCancel}
                >
                  <X size={16} />
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 bg-gradient-to-r from-[#6366f1] to-[#7c65f6] rounded-lg text-sm font-medium text-white shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all duration-200"
                  onClick={handleConfirm}
                  disabled={!transcript.trim()}
                  style={{
                    opacity: transcript.trim() ? 1 : 0.6,
                    cursor: transcript.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Check size={16} />
                  Confirm
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Enhanced CSS for animations */}
      <style>
        {`
          @keyframes gradient-animation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
    </AnimatePresence>
  );
};

export default SpeechOverlay; 