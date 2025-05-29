import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import BotIcon from './elements/BotIcon';
import ActionBar from './ActionBar';
import PlaceholderText, { getStaticPlaceholderText } from './PlaceholderText';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  hasMessages?: boolean;
  onGenerateReport?: () => void;
  onSaveProject?: () => void;
  isThinking?: boolean;
  projectId?: string;
  isLoadedProject?: boolean;
  onMicrophoneClick?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  hasMessages = false,
  onGenerateReport,
  onSaveProject,
  isThinking = false,
  projectId = '',
  isLoadedProject = false,
  onMicrophoneClick
}) => {
  const [input, setInput] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [messagesSent, setMessagesSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatInputRef = useRef<HTMLDivElement>(null);
  const isTyping = input.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isThinking) {
      setIsProcessing(true);
      onSendMessage(input.trim());
      setInput('');
      setMessagesSent(true);
      
      // Simulate processing state for a brief moment
      setTimeout(() => {
        setIsProcessing(false);
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
  };

  // This function is now just a pass-through to the parent's handler
  const handleMicrophoneClick = () => {
    if (!isThinking && onMicrophoneClick) {
      onMicrophoneClick();
    }
  };

  // Get placeholder text props
  const placeholderProps = { 
    hasMessages, 
    messagesSent, 
    hasInteracted 
  };

  // Only show the bot icon when there are messages or messages were sent, and no text in the input
  const showBotIcon = (hasMessages || messagesSent) && !input;
  
  // Determine if we should show the typing effect placeholder
  const showTypingPlaceholder = !input && !isThinking && !hasInteracted && !messagesSent && !hasMessages;
  
  // Only set static placeholder when NOT showing the typing effect - leave completely empty when showing typing effect
  const staticPlaceholder = showTypingPlaceholder ? "" : (isThinking ? "" : (showBotIcon ? "" : getStaticPlaceholderText(placeholderProps)));

  return (
    <div className="p-3 bg-white border-t sticky bottom-0 z-10 shadow-sm" ref={chatInputRef}>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={staticPlaceholder}
            className={`min-h-[24px] max-h-[50px] rounded-xl border-gray-200 
              focus:border-securetrack-purple focus:ring-securetrack-purple/20 
              transition-all shadow-sm text-left ${showBotIcon ? 'pl-28 pr-24' : 'pr-24'}
              ${isThinking ? 'bg-gray-50' : ''}`}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !isThinking) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isThinking}
            style={{ 
              paddingLeft: showBotIcon ? '7rem' : '1rem',
              textAlign: 'left',
              caretColor: 'auto',
              direction: 'ltr',
              textIndent: '0px'
            }}
          />
          
          <BotIcon showIcon={showBotIcon} />
          
          {/* Typing effect placeholder - appears as an overlay */}
          {showTypingPlaceholder && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <PlaceholderText 
                hasMessages={hasMessages} 
                messagesSent={messagesSent} 
                hasInteracted={hasInteracted} 
              />
            </div>
          )}
          
          <ActionBar 
            isInputEmpty={!input.trim()} 
            isProcessing={isProcessing || isThinking}
            projectId={projectId}
            onMicrophoneClick={handleMicrophoneClick}
          />
        </div>
      </form>
    </div>
  );
};

export default ChatInput;