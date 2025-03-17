// API Types
export interface DesignRequest {
    project_id: string;
    query: string;
    diagram_state?: {
      nodes: any[];
      edges: any[];
    };
    session_id?: string;
  }
  
  export enum ResponseType {
    ARCHITECTURE = "ArchitectureResponse",
    EXPERT = "ExpertResponse",
    CLARIFICATION = "ClarificationResponse",
    OUT_OF_CONTEXT = "OutOfContextResponse"
  }
  
  export interface BaseResponse {
    response_type: ResponseType;
    message: string;
    confidence: number;
    session_id: string;
    thinking?: string;
    has_redacted_thinking?: boolean;
  }
  
  export interface ArchitectureResponse extends BaseResponse {
    response_type: ResponseType.ARCHITECTURE;
    diagram_updates?: any;
    nodes_to_add?: any[];
    edges_to_add?: any[];
    elements_to_remove?: string[];
  }
  
  export interface ExpertResponse extends BaseResponse {
    response_type: ResponseType.EXPERT;
    references?: { title: string; url: string }[];
    related_concepts?: string[];
  }
  
  export interface ClarificationResponse extends BaseResponse {
    response_type: ResponseType.CLARIFICATION;
    questions: string[];
  }
  
  export interface OutOfContextResponse extends BaseResponse {
    response_type: ResponseType.OUT_OF_CONTEXT;
    suggestion?: string;
  }
  
  export interface DesignResponse {
    response: BaseResponse;
    show_thinking?: boolean;
    response_id?: string;
    
    // Architecture-specific fields
    diagram_updates?: any;
    nodes_to_add?: any[];
    edges_to_add?: any[];
    elements_to_remove?: string[];
    
    // Expert-specific fields
    references?: { title: string; url: string }[];
    related_concepts?: string[];
    
    // Clarification-specific fields
    questions?: string[];
    
    // Out-of-context-specific fields
    suggestion?: string;
  }