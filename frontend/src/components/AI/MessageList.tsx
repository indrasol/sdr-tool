
import React, { useRef, useEffect } from 'react';
import ChatMessage, { Message } from './ChatMessage';
import EmptyChatState from './EmptyChatState';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <EmptyChatState />
      ) : (
        messages.map((message, index) => (
          <ChatMessage key={index} message={message} index={index} />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;