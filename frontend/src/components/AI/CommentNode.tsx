import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { NodeToolbar, Position, NodeResizer } from '@xyflow/react';
import { Trash } from 'lucide-react';
import { NodeProps } from './types/diagramTypes';
import './CommentNode.css'; // Import the CSS file

const CommentNode = ({ 
  id, 
  data, 
  selected,
  style
}: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [commentText, setCommentText] = useState(data?.label || 'Click to add note...');
  const [nodeHeight, setNodeHeight] = useState(120); // Default minimum height
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Generate a random rotation for the sticky note (-3 to 3 degrees for subtlety)
  const randomRotation = useRef(Math.random() * 6 - 3);
  
  // Initial mount effect - update height once after mounting
  useEffect(() => {
    // Wait for content to render fully
    const timer = setTimeout(() => {
      if (textContentRef.current) {
        const contentHeight = textContentRef.current.scrollHeight;
        const newHeight = Math.max(contentHeight, 120);
        setNodeHeight(newHeight + 24); // Add padding
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Adjust textarea height based on content when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = 'auto'; // Reset height
          const newHeight = Math.max(textarea.scrollHeight, 120);
          textarea.style.height = `${newHeight}px`;
          setNodeHeight(newHeight + 24); // Add padding
        }
      };
      
      adjustHeight();
      // Add event listener for input to continually adjust height
      textareaRef.current.addEventListener('input', adjustHeight);
      
      return () => {
        if (textareaRef.current) {
          textareaRef.current.removeEventListener('input', adjustHeight);
        }
      };
    }
  }, [isEditing, commentText]);

  // Adjust height based on text content when not editing
  useEffect(() => {
    if (!isEditing && textContentRef.current) {
      const contentHeight = textContentRef.current.scrollHeight;
      const newHeight = Math.max(contentHeight, 120);
      setNodeHeight(newHeight + 24); // Add padding
    }
  }, [isEditing, commentText]);

  // Update height when data.label changes (e.g., when loading saved notes)
  useEffect(() => {
    if (data?.label !== commentText) {
      setCommentText(data?.label || 'Click to add note...');
      // Schedule height update after content renders
      setTimeout(() => {
        if (textContentRef.current) {
          const contentHeight = textContentRef.current.scrollHeight;
          const newHeight = Math.max(contentHeight, 120);
          setNodeHeight(newHeight + 24); // Add padding
        }
      }, 10);
    }
  }, [data?.label]);

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

  const handleDelete = () => {
    if (data && data.onDelete) {
      data.onDelete(id);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Enhanced sticky note style with proper sticky note look
  const nodeStyle: CSSProperties = {
    minWidth: '150px',
    minHeight: `${nodeHeight}px`,
    width: '100%',
    height: '100%',
    transform: `rotate(${randomRotation.current}deg)`,
    // Only keep essential inline styles, the rest is in CSS
    ...style,
  };

  // Additional wrapper style to hide completely any blue selection box from ReactFlow
  const wrapperStyle: CSSProperties = {
    // No special styling needed here, we'll use className instead
  };

  return (
    <div 
      className={`sticky-note-wrapper ${selected ? 'sticky-note-selected' : ''}`} 
      ref={nodeRef}
      style={wrapperStyle}
    >
      {(selected || isHovered) && (
        <NodeToolbar 
          position={Position.Top} 
          offset={10} 
          className="flex gap-1"
        >
          <button
            onClick={handleDelete}
            className="p-1 bg-white rounded-full border border-gray-200 shadow-sm hover:bg-red-50 transition-colors"
            title="Delete sticky note"
          >
            <Trash size={14} className="text-red-500" />
          </button>
        </NodeToolbar>
      )}
      
      {/* Custom NodeResizer with completely transparent selection border */}
      {selected && (
        <NodeResizer 
          minWidth={150}
          minHeight={nodeHeight}
          isVisible={true}
          // Use CSS classes instead of inline styles
          lineClassName="sticky-note-resizer-line"
          handleClassName={`sticky-note-resizer-handle ${isHovered ? "visible" : ""}`}
        />
      )}

      <div 
        className={`comment-node ${selected ? 'shadow-md' : ''}`}
        style={nodeStyle}
        onClick={isEditing ? undefined : handleTextClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
              fontFamily: "inherit", 
              fontSize: 'inherit',
              lineHeight: '1.5',
              background: 'transparent',
              color: 'inherit',
              minHeight: '100px'
            }}
            placeholder="Type your note here..."
          />
        ) : (
          <div 
            ref={textContentRef}
            className="sticky-text-content"
          >
            {commentText || 'Click to add note...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentNode;