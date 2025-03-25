
import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { NodeProps } from './types/diagramTypes';
import { NodeResizer } from '@xyflow/react';

const CommentNode = ({ 
  id, 
  data, 
  selected,
  style
}: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [commentText, setCommentText] = useState(data?.label || 'This is a comment. Click the text area to edit it.');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleTextClick = () => {
    setIsEditing(true);
  };

  const handleTextBlur = () => {
    setIsEditing(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentText(e.target.value);
    if (data) {
      data.label = e.target.value;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  const nodeStyle: CSSProperties = {
    border: '2px solid #4F46E5',
    borderRadius: '8px',
    minWidth: '220px',
    minHeight: '40px',
    background: 'white',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    ...(style as CSSProperties)
  };

  return (
    <>
      {selected && (
        <NodeResizer 
          minWidth={220}
          minHeight={40}
          isVisible={!!selected}
          lineClassName="border-indigo-500"
          handleClassName="h-2 w-2 bg-white border-2 border-indigo-500 rounded"
          handleStyle={{ borderWidth: 2 }}
        />
      )}

      <div 
        className={`comment-node rounded-md text-gray-800 ${selected ? 'shadow-md' : ''}`}
        style={nodeStyle}
        onClick={isEditing ? undefined : handleTextClick}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleKeyDown}
            className="w-full resize-none border-none outline-none bg-transparent p-0"
            style={{ 
              fontFamily: 'inherit', 
              fontSize: 'inherit',
              textAlign: 'center'
            }}
          />
        ) : (
          <div className="w-full text-center">
            {commentText}
          </div>
        )}
      </div>
    </>
  );
};

export default CommentNode;