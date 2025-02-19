

export type Message = {
    id: number;
    content: string;
    type: 'user' | 'assistant';
    timestamp: Date;
  };
  
export type ToolType = 'select' | 'square' | 'circle' | 'arrow' | 'eraser';