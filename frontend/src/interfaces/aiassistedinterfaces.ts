// API Types
export interface DesignRequest {
  project_id: string;
  query: string;
  diagram_state?: {
    nodes: any[];
    edges: any[];
  };
  session_id?: string;
  view_mode: string;
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

export interface DFDGenerationStartedResponse {
  message: string;
  project_code: string;
  detail?: string;
  status?: number;
}
interface NodeProperties {
  description: string;
}

interface EdgeProperties {
  description: string;
  data_type: string;
  crosses_trust_boundary: string[];
}

interface ThreatProperties {
  threat_type: string;
  attack_vector: string;
  impact: string;
}

export interface DFDElement {
  id: string;
  type: string;
  label: string;
  properties: NodeProperties;
  boundary_id?: string;
  left_boundary_id?: string;
  right_boundary_id?: string;
}

export interface DFDDataFlow {
  id: string;
  source: string;
  target: string;
  label: string;
  properties: EdgeProperties;
}

export interface DFDBoundary {
  id: string;
  label: string;
  element_ids: string[];
  position: number;
  properties: {
    description: string;
  };
}

export interface ThreatItem {
  id: string;
  description: string;
  mitigation: string;
  severity: string;
  target_elements?: string[];
  properties: ThreatProperties;
}

export interface DFDData {
  threat_model_id: string;
  nodes: DFDElement[];
  edges: DFDDataFlow[];
  boundaries: DFDBoundary[];
  threats: ThreatItem[];
  generated_at: string;
  name?: string;
}

// New interfaces aligned with backend structures

export interface DFDSwitchRequest {
  diagram_state?: {
    nodes: any[];
    edges: any[];
  };
  session_id?: string;
  project_code?: string;
}

export interface ThreatsResponse {
  severity_counts: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  threats: ThreatItem[];
}

export interface DFDModelResponse {
  elements: DFDElement[];
  edges: DFDEdge[];
  boundaries: DFDBoundary[];
}

export interface DFDEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  properties?: Record<string, unknown>;
}

export interface FullThreatModelResponse {
  threat_model_id?: string;
  dfd_model: DFDModelResponse;
  threats: ThreatsResponse;
  generated_at?: string;
}