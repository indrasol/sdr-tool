
import React, { useState } from 'react';
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
  const isTyping = input.trim().length > 0;

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