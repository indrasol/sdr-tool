import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  useMarkdown?: boolean;
  onComplete?: () => void;
}

// Cache to store completed typing sessions
const typingCache = new Map<string, boolean>();

// Utility function to clear cache (useful for development or when needed)
export const clearTypingCache = () => {
  typingCache.clear();
};

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 2, // Faster default speed
  useMarkdown = true,
  onComplete
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const cacheKey = useRef<string>('');

  // Generate cache key based on text content (more robust)
  useEffect(() => {
    // Create a more robust cache key using content hash
    const textHash = text.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    
    cacheKey.current = `typing_${textHash}_${text.length}`;
    
    // Check if this content was already typed
    if (typingCache.get(cacheKey.current)) {
      setDisplayText(text);
      setCurrentIndex(text.length);
      setIsComplete(true);
      onComplete?.();
      return;
    }
    
    // Reset for new content
    setDisplayText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text, onComplete]);

  useEffect(() => {
    if (currentIndex < text.length && !isComplete) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    } else if (currentIndex >= text.length && !isComplete) {
      // Mark as complete and cache
      setIsComplete(true);
      typingCache.set(cacheKey.current, true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, isComplete, onComplete, displayText.length]);

  // Enhanced markdown components matching ReportContent with improved styling
  const markdownComponents = {
    h1: ({children}) => <h1 className="text-2xl font-bold mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">{children}</h1>,
    h2: ({children}) => {
      const text = children?.toString() || '';
      let colorClass = "text-gray-800";
      let iconElement = null;
      
      // Color code risk subsections
      if (text.includes('High Risk') || text.includes('High Severity')) {
        colorClass = "text-red-600";
        iconElement = <AlertTriangle className="w-5 h-5 text-red-500 inline mr-2" />;
      } else if (text.includes('Medium Risk') || text.includes('Medium Severity')) {
        colorClass = "text-orange-500";
        iconElement = <AlertCircle className="w-5 h-5 text-orange-500 inline mr-2" />;
      } else if (text.includes('Low Risk') || text.includes('Low Severity')) {
        colorClass = "text-blue-600";
        iconElement = <Info className="w-5 h-5 text-blue-500 inline mr-2" />;
      } else if (text.includes('Key Components') || text.includes('Components')) {
        colorClass = "text-indigo-600";
      } else if (text.includes('Security') || text.includes('Considerations')) {
        colorClass = "text-green-600";
      } else if (text.includes('Benefits') || text.includes('Architecture')) {
        colorClass = "text-purple-600";
      }
      
      return (
        <h2 className={`text-xl font-semibold mb-4 mt-6 ${colorClass} flex items-center`}>
          {iconElement}
          {children}
        </h2>
      );
    },
    h3: ({children}) => <h3 className="text-lg font-semibold mb-3 text-gray-800 border-l-4 border-blue-500 pl-3">{children}</h3>,
    p: ({children}) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
    ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 ml-4">{children}</ul>,
    ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 ml-4">{children}</ol>,
    li: ({children}) => <li className="mb-1 leading-relaxed">{children}</li>,
    strong: ({children}) => <strong className="font-semibold text-gray-900 bg-yellow-50 px-1 rounded">{children}</strong>,
    em: ({children}) => <em className="italic text-gray-800">{children}</em>,
    code: ({children, className}) => {
      const isInline = !className;
      return isInline ? (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>
      ) : (
        <code className="block bg-gray-100 p-4 rounded-md text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">{children}</code>
      );
    },
    blockquote: ({children}) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-4 bg-blue-50/50 py-2 rounded-r-md">{children}</blockquote>
    ),
    table: ({children}) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border-collapse border border-gray-300">{children}</table>
      </div>
    ),
    th: ({children}) => (
      <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">{children}</th>
    ),
    td: ({children}) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
  };

  const content = (
    <>
      {useMarkdown ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {displayText}
        </ReactMarkdown>
      ) : (
        <div className="whitespace-pre-line text-gray-700 leading-relaxed">
          {displayText}
        </div>
      )}
      {!isComplete && (
        <span className="animate-pulse text-blue-500 font-bold">|</span>
      )}
    </>
  );

  return <div className="prose prose-lg max-w-none">{content}</div>;
};

export default TypewriterText;