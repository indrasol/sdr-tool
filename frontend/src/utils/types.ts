

export type Message = {
    id: number;
    content: string;
    type: 'user' | 'assistant';
    timestamp: Date;
  };
  
export type ToolType = 'select' | 'square' | 'rectangle' | 'circle' | 'ellipse' | 'diamond' | 'arrow' | 'text' | 'eraser' | 'clear' | 'cloud' | 'database' | 'server' | 'folder' | 'file' | 'settings' | 'users' | 'lock' | 'network' | 'code';


