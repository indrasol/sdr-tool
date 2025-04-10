
import React, { useRef, useEffect } from 'react';
import ChatMessage, { Message } from './ChatMessage';
import EmptyChatState from './EmptyChatState';
import { motion } from 'framer-motion'
import { Bot } from 'lucide-react';
// import './MessageList.css'

interface MessageListProps {
  messages: Message[];
  isThinking: boolean;
  thinking?: { text: string; hasRedactedContent: boolean } | null;
  error?: string | null;
  isLoading?: boolean;
  isLoadedProject?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isThinking = false, thinking = null, error = null, isLoading = false, isLoadedProject = false  }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // console.log("MessageList rendering with messages:", messages);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Loading indicator animation variants
  const loadingVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <EmptyChatState />
      ) : (
        messages.map((message, index) => (
          <ChatMessage key={index} message={message} index={index} isLoadedProject={isLoadedProject} />
        ))
      )}
      {/* Loading indicator */}
      {isLoading && (
        <motion.div 
          initial="initial"
          animate="animate"
          variants={loadingVariants}
          className="max-w-[65%] mr-auto"
        >
          <div className="p-2.5 rounded-xl shadow-sm backdrop-blur-sm text-sm bg-gradient-to-r from-[#f3f3f3] to-[#ffffff] border border-gray-100">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="text-xs mt-1 px-2 text-gray-500 flex items-center gap-1 justify-start">
            <span className="flex items-center gap-1">
              <Bot size={14} className="text-securetrack-purple" /> 
            </span>
            • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </motion.div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

// import React, { useRef, useEffect } from 'react';
// import ChatMessage, { Message } from './ChatMessage';
// import EmptyChatState from './EmptyChatState';
// import ThinkingIndicator from './Thinkingindicator';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import ThinkingDisplay from './ThinkingDisplay';

// interface MessageListProps {
//   messages: Message[];
//   isThinking?: boolean;
//   thinking?: { text: string; hasRedactedContent: boolean } | null;
//   error?: string | null;
//   isLoadedProject?: boolean; // Add this prop to track if project was loaded
// }

// const MessageList: React.FC<MessageListProps> = ({ 
//   messages, 
//   isThinking = false, 
//   thinking = null,
//   error = null,
//   isLoadedProject = false // Default to false if not provided
// }) => {
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const scrollAreaRef = useRef<HTMLDivElement>(null);

//   // Fixed scroll to bottom implementation
//   useEffect(() => {
//     if (messagesEndRef.current) {
//       setTimeout(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//       }, 50);
//     }
//   }, [messages, isThinking, error, thinking]);

//   // useEffect(() => {
//   //   console.log("Messages state updated:", messages);
//   // }, [messages]);
  


//   return (
//     <div className="flex-grow overflow-hidden relative" style={{ height: 'calc(100vh - 180px)' }}>
//       <ScrollArea className="h-full pr-1 absolute inset-0" scrollHideDelay={300}>
//         <div className="p-4 pb-20" ref={scrollAreaRef}>
//           <div className="flex flex-col space-y-3">
//             {messages.length === 0 && !isThinking && !error ? (
//               <EmptyChatState />
//             ) : (
//               <>
//                 {messages.map((message, index) => {
//                   // Determine if this message should skip the typing animation:
//                   // 1. If it's explicitly marked as already typed
//                   // 2. If it's marked as pre-existing
//                   // 3. If we're loading a project and this isn't the most recent message
//                   const shouldSkipTyping = 
//                   message.isAlreadyTyped === true || 
//                   message.isPreExisting === true || 
//                   (isLoadedProject && index < messages.length - 1);

//                   // console.log(`Messages inside render : ${message}`)
//                   // console.log(`Messages already typed : ${message.isAlreadyTyped}`)
//                   // console.log(`shouldSkipTyping  : ${shouldSkipTyping}`)
                  
//                   return (
//                     <ChatMessage 
//                       key={index} 
//                       message={message}
//                       isLoadedProject={isLoadedProject}
//                       // message={{
//                       //   ...message,
//                       //   isAlreadyTyped: shouldSkipTyping
//                       // }} 
//                       index={index} 
//                     />
//                   );
//                 })}
//               </>
//             )}
            
//             {/* Error message */}
//             {error && (
//               <Alert variant="destructive" className="my-2">
//                 <AlertDescription>{error}</AlertDescription>
//               </Alert>
//             )}
            
//             {/* Position the thinking indicator within the message flow */}
//             {isThinking && (
//               <div className="py-2 mb-4">
//                 <ThinkingIndicator />
//               </div>
//             )}
            
//             {/* Thinking content display */}
//             {thinking && thinking.text && (
//               <div className="my-2">
//                 <ThinkingDisplay
//                   thinking={thinking.text}
//                   hasRedactedThinking={thinking.hasRedactedContent}
//                 />
//               </div>
//             )}
            
//             {/* This invisible element helps with scrolling to the bottom */}
//             <div ref={messagesEndRef} className="h-4" />
//           </div>
//         </div>
//       </ScrollArea>
//     </div>
//   );
// };

// export default MessageList;