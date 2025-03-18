import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import BotIcon from './elements/BotIcon';
import ActionBar from './ActionBar';
import PlaceholderText from './PlaceholderText';
import { WallpaperOption } from './types/chatTypes';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onGenerateReport: () => void;
  hasMessages?: boolean;
  onWallpaperChange?: (wallpaper: WallpaperOption) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onGenerateReport, 
  hasMessages = false,
  onWallpaperChange
}) => {
  const [input, setInput] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [messagesSent, setMessagesSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textareaKey, setTextareaKey] = useState(0); // Force re-render key
  const isTyping = input.trim().length > 0;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const positionCursorAtStart = () => {
    console.log("Attempting to position cursor at start...");
    
    // Try multiple methods to locate the textarea element
    const textareaElement = textareaRef.current;
    
    if (textareaElement) {
      console.log("Found textarea element, focusing...");
      textareaElement.focus();
      
      try {
        // Try standard API
        textareaElement.setSelectionRange(0, 0);
      } catch (e) {
        console.error("Error positioning cursor:", e);
      }
    } else {
      console.log("Textarea element not found");
      
      // Fallback to DOM query if ref fails
      const domTextarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
      if (domTextarea) {
        domTextarea.focus();
        try {
          domTextarea.setSelectionRange(0, 0);
        } catch (e) {
          console.error("Error positioning cursor on DOM element:", e);
        }
      }
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setIsProcessing(true);
      onSendMessage(input.trim());
      setInput('');
      setMessagesSent(true);
      
      // Simulate processing state for a brief moment
      setTimeout(() => {
        setIsProcessing(false);
        setTextareaKey(prev => prev + 1); // Force re-render
        
        // Try multiple times with increasing delays
        positionCursorAtStart();
        setTimeout(positionCursorAtStart, 50);
        setTimeout(positionCursorAtStart, 150);
      }, 500);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleInputFocus = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    // Always position cursor at start when focusing
    if (input === '') {
      positionCursorAtStart();
    }
  };

  // Get placeholder text as a string
  const placeholderText = PlaceholderText({ 
    hasMessages, 
    messagesSent, 
    hasInteracted 
  });

  // Only show the bot icon when there are messages or messages were sent, and no text in the input
  const showBotIcon = (hasMessages || messagesSent) && !input;

  return (
    <div className="p-3 bg-white border-t">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Textarea
            key={textareaKey}
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={showBotIcon ? "" : placeholderText}
            className={`min-h-[24px] max-h-[50px] rounded-xl border-gray-200 
              focus:border-securetrack-purple focus:ring-securetrack-purple/20 
              transition-all shadow-sm text-left ${showBotIcon ? 'pl-28 pr-24' : 'pr-24'}`}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            style={{ 
              textAlign: 'left', 
              textIndent: '0px',
              paddingTop: '8px',
              paddingBottom: '8px',
              caretColor: 'auto',
              direction: 'ltr',
              unicodeBidi: 'normal',
              textTransform: 'none',
              msTextAutospace: 'none',
              wordSpacing: 'normal',
              textJustify: 'initial'
            }}
          />
          
          <BotIcon showIcon={showBotIcon} /> 
          
          <ActionBar 
            isInputEmpty={!input.trim()} 
            isProcessing={isProcessing}
            onGenerateReport={onGenerateReport}
            onWallpaperChange={onWallpaperChange}
          />
        </div>
      </form>
    </div>
  );
};

export default ChatInput;



// import React, { useState } from 'react';
// import { Textarea } from '@/components/ui/textarea';
// import BotIcon from './elements/BotIcon';
// import ActionBar from './ActionBar';
// import PlaceholderText from './PlaceholderText';
// import { WallpaperOption } from './types/chatTypes';

// interface ChatInputProps {
//   onSendMessage: (message: string) => void;
//   onGenerateReport: () => void;
//   hasMessages?: boolean;
//   onWallpaperChange?: (wallpaper: WallpaperOption) => void;
// }

// const ChatInput: React.FC<ChatInputProps> = ({ 
//   onSendMessage, 
//   onGenerateReport, 
//   hasMessages = false,
//   onWallpaperChange
// }) => {
//   const [input, setInput] = useState('');
//   const [hasInteracted, setHasInteracted] = useState(false);
//   const [messagesSent, setMessagesSent] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const isTyping = input.trim().length > 0;

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (input.trim()) {
//       setIsProcessing(true);
//       onSendMessage(input.trim());
//       setInput('');
//       setMessagesSent(true);
      
//       // Simulate processing state for a brief moment
//       setTimeout(() => {
//         setIsProcessing(false);
//       }, 500);
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     setInput(e.target.value);
//     if (!hasInteracted) {
//       setHasInteracted(true);
//     }
//   };

//   const handleInputFocus = () => {
//     if (!hasInteracted) {
//       setHasInteracted(true);
//     }
//   };

//   // Get placeholder text as a string
//   const placeholderText = PlaceholderText({ 
//     hasMessages, 
//     messagesSent, 
//     hasInteracted 
//   });

//   // Only show the bot icon when there are messages or messages were sent, and no text in the input
//   const showBotIcon = (hasMessages || messagesSent) && !input;

//   return (
//     <div className="p-3 bg-white border-t">
//       <form onSubmit={handleSubmit} className="space-y-2">
//         <div className="relative">
//           <Textarea
//             value={input}
//             onChange={handleInputChange}
//             onFocus={handleInputFocus}
//             placeholder={showBotIcon ? "" : placeholderText}
//             className={`min-h-[24px] max-h-[50px] rounded-xl border-gray-200 
//               focus:border-securetrack-purple focus:ring-securetrack-purple/20 
//               transition-all shadow-sm text-left ${showBotIcon ? 'pl-28 pr-24' : 'pr-24'}`}
//             onKeyDown={e => {
//               if (e.key === 'Enter' && !e.shiftKey) {
//                 e.preventDefault();
//                 handleSubmit(e);
//               }
//             }}
//             style={{ 
//               textAlign: 'left', 
//               textIndent: '0px',
//               paddingTop: '8px',
//               paddingBottom: '8px',
//               caretColor: 'auto',
//               direction: 'ltr',
//               unicodeBidi: 'normal',
//               textTransform: 'none',
//               msTextAutospace: 'none',
//               wordSpacing: 'normal',
//               textJustify: 'initial'
//             }}
//           />
          
//           <BotIcon showIcon={showBotIcon} />
          
//           <ActionBar 
//             isInputEmpty={!input.trim()} 
//             isProcessing={isProcessing}
//             onGenerateReport={onGenerateReport}
//             onWallpaperChange={onWallpaperChange}
//           />
//         </div>
//       </form>
//     </div>
//   );
// };

// export default ChatInput;