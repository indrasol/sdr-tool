import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';

interface TypingEffectProps {
  content: string;
  speed?: number;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ content, speed = 10 }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sanitize content for security
  const sanitizedContent = DOMPurify.sanitize(content);

  useEffect(() => {
    let currentLength = 0;
    setIsComplete(false);
    setDisplayedContent('');

    const interval = setInterval(() => {
      if (currentLength <= sanitizedContent.length) {
        setDisplayedContent(sanitizedContent.slice(0, currentLength));
        currentLength++;
        
        // Add slight delay to ensure DOM updates before scrolling
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      }, 10); // Adjusted delay for better synchronization
    } else {
      setIsComplete(true);
      clearInterval(interval);
    }
  }, speed);

    return () => clearInterval(interval);
  }, [sanitizedContent, speed]);

  // **Fix Scroll When Image Loads**
  useEffect(() => {
    const currentContentRef = contentRef.current; // Capture current ref value
    if (currentContentRef) {
      const observer = new ResizeObserver(() => {
        currentContentRef!.scrollTop = currentContentRef!.scrollHeight;
      });

      observer.observe(currentContentRef);

      return () => observer.disconnect();
    }
  }, [displayedContent]);

  return (
    <div 
      ref={contentRef} 
      className="prose prose-sm dark:prose-invert max-w-none overflow-y-auto h-full p-4"
      style={{ maxHeight: '100vh' }} // Ensure max height for scrolling
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800 dark:text-gray-200" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="mb-6 ml-6 list-disc space-y-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="mb-6 ml-6 list-decimal space-y-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="mb-1 text-gray-700 dark:text-gray-300" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-600 dark:text-gray-400" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" {...props} />
          ),
          hr: () => (
            <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
          ),
          img: ({ src, alt }) => {
            // Fix image URL by ensuring it has the proper base
            const baseUrl = 'http://localhost:8000';
            const imgSrc = src?.startsWith('/') ? `${baseUrl}${src}` : src;
            
            return (
              <div className="my-6 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                <img
                  src={imgSrc}
                  alt={alt || "Report image"}
                  className="max-w-full h-auto mx-auto"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                  onLoad={() => {
                    if (contentRef.current) {
                      contentRef.current.scrollTop = contentRef.current.scrollHeight;
                    }
                  }}
                  onError={(e) => {
                    console.error("Image failed to load:", imgSrc);
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjRjVGNUY1IiBkPSJNMCAwaDIwMHYyMDBIMHoiLz48ZyBmaWxsPSIjQTBBNUFBIj48cGF0aCBkPSJNODcgOTRoMjZ2MTJIODd6TTcwIDExMGg2MHYxMEg3MHpNODEgMTI4aDM4djEwSDgxeiIvPjwvZz48cGF0aCBkPSJNNjggODBjMC0xMC41NDIgOC41Ni0xOSAxOS4xLTE5aDI2LjhjMTAuNTQgMCAxOS4xIDguNDU4IDE5LjEgMTl2NDBjMCAxMC41NDItOC41NiAxOS0xOS4xIDE5aC0yNi44Yy0xMC41NCAwLTE5LjEtOC40NTgtMTkuMS0xOVY4MHptNSAwdjQwYzAgNy43OTYgNi4zMDUgMTQgMTQuMSAxNGgyNi44YzcuNzk1IDAgMTQuMS02LjIwNCAxNC4xLTE0VjgwYzAtNy43OTYtNi4zMDUtMTQtMTQuMS0xNEg4Ny4xQzc5LjMwNSA2NiA3MyA3Mi4yMDQgNzMgODB6IiBmaWxsPSIjQTBBNUFBIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48L2c+PC9zdmc+';
                  }}
                />
              </div>
            );
          },
          div: ({ className, ...props }) => {
            if (className && className.includes('alert')) {
              const alertType = className.includes('alert-info')
                ? 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
                : className.includes('alert-warning')
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300'
                  : className.includes('alert-danger')
                    ? 'bg-red-50 border-red-400 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
                    : className.includes('alert-success')
                      ? 'bg-green-50 border-green-400 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                      : 'bg-gray-50 border-gray-400 text-gray-800 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-300';

              return (
                <div className={`p-4 my-4 border-l-4 rounded-r ${alertType}`} {...props} />
              );
            }
            return <div {...props} />;
          },
        }}
      >
        {displayedContent}
      </ReactMarkdown>

      {!isComplete && (
        <span className="inline-block w-2 h-4 ml-1 bg-gray-800 dark:bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};
//           // Enhanced code block rendering with syntax highlighting
//           code: ({ node, inline, className, children, ...props }) => {
//             const match = /language-(\w+)/.exec(className || '');
//             const language = match ? match[1] : '';
            
//             if (!inline && language) {
//               return (
//                 <div className="my-6 rounded-lg overflow-hidden">
//                   <SyntaxHighlighter
//                     style={vscDarkPlus}
//                     language={language}
//                     PreTag="div"
//                     className="rounded-lg"
//                     showLineNumbers
//                     wrapLines
//                     {...props}
//                   >
//                     {String(children).replace(/\n$/, '')}
//                   </SyntaxHighlighter>
//                 </div>
//               );
//             } else if (!inline) {
//               // For code blocks without a specified language
//               return (
//                 <div className="my-6 rounded-lg overflow-hidden">
//                   <SyntaxHighlighter
//                     style={vscDarkPlus}
//                     PreTag="div"
//                     className="rounded-lg"
//                     {...props}
//                   >
//                     {String(children).replace(/\n$/, '')}
//                   </SyntaxHighlighter>
//                 </div>
//               );
//             } else {
//               // For inline code
//               return (
//                 <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono text-sm" {...props}>
//                   {children}
//                 </code>
//               );
//             }
//           },
//           // Add support for callouts/alerts with custom styling
//           div: ({ node, className, ...props }) => {
//             if (className && className.includes('alert')) {
//               const alertType = className.includes('alert-info') 
//                 ? 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
//                 : className.includes('alert-warning') 
//                 ? 'bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300'
//                 : className.includes('alert-danger') 
//                 ? 'bg-red-50 border-red-400 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
//                 : className.includes('alert-success') 
//                 ? 'bg-green-50 border-green-400 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
//                 : 'bg-gray-50 border-gray-400 text-gray-800 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-300';
              
//               return (
//                 <div className={`p-4 my-4 border-l-4 rounded-r ${alertType}`} {...props} />
//               );
//             }
            
//             return <div {...props} />;
//           }
//         }}
//       >
//         {displayedContent}
//       </ReactMarkdown>
      
//       {/* Optional loading indicator while typing is in progress */}
//       {!isComplete && (
//         <span className="inline-block w-2 h-4 ml-1 bg-gray-800 dark:bg-gray-200 animate-pulse"/>
//       )}
//     </div>
//   );
// };

export { TypingEffect };