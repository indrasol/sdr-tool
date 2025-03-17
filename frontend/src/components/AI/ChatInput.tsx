
import React, { useEffect, useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import BotIcon from './elements/BotIcon';
import ActionBar from './ActionBar';
// Import as a utility function, not a component
import { getPlaceholderText } from '@/utils/placeholderUtils';
import { WallpaperOption } from './types/chatTypes';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onGenerateReport: () => void;
  onSaveProject?: () => void; 
  hasMessages?: boolean;
  onWallpaperChange?: (wallpaper: WallpaperOption) => void;
  isDisabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onGenerateReport, 
  onSaveProject,
  hasMessages = false,
  onWallpaperChange,
  isDisabled = false
}) => {
  const [input, setInput] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [messagesSent, setMessagesSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTyping = input.trim().length > 0;


  // Update isProcessing when isDisabled changes
  useEffect(() => {
    setIsProcessing(isDisabled);
  }, [isDisabled]);

  // Handle cursor position - restore focus at end of text when needed
  const focusTextareaAtEnd = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const length = textarea.value.length;
      
      // Set selection range to end of text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(length, length);
      }, 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setIsProcessing(true);
      onSendMessage(input.trim());
      setInput('');
      setMessagesSent(true);
      
      // // Simulate processing state for a brief moment
      // setTimeout(() => {
      //   setIsProcessing(false);
      // }, 500);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    // Ensure cursor is at the end when focused
    if (textareaRef.current) {
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  };

  const handleInputFocus = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  // Get placeholder text as a string
  const placeholderText = isDisabled 
    ? "Waiting for Guardian AI's response..." 
    : getPlaceholderText(hasMessages, messagesSent, hasInteracted);

  // Only show the bot icon when there are messages or messages were sent, and no text in the input
  const showBotIcon = (hasMessages || messagesSent) && !input;

  // Ensure cursor stays at proper position when showBotIcon changes
  useEffect(() => {
    if (input.length > 0 && document.activeElement === textareaRef.current) {
      focusTextareaAtEnd();
    }
  }, [showBotIcon, input]);

  return (
    <div className="p-3 bg-white border-t">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Textarea
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
              paddingLeft: showBotIcon ? '112px' : '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              caretColor: '#8a7af8',
              direction: 'ltr',
              unicodeBidi: 'normal',
              textTransform: 'none',
              // msTextAutospace: 'none',
              // wordSpacing: 'normal',
              // textJustify: 'initial'
            }}
          />
          
          {/* <BotIcon showIcon={showBotIcon} /> */}
          {showBotIcon && <BotIcon showIcon={true} />}
          
          <ActionBar 
            isInputEmpty={!input.trim()} 
            isProcessing={isProcessing}
            onGenerateReport={onGenerateReport}
            onSaveProject={onSaveProject}
            onWallpaperChange={onWallpaperChange}
            isDisabled={isDisabled}
          />
        </div>
      </form>
    </div>
  );
};

export default ChatInput;