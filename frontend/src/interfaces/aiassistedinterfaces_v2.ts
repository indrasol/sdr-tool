export enum IntentV2 {
  DSL_CREATE = 'DSL_CREATE',
  DSL_UPDATE = 'DSL_UPDATE',
  VIEW_TOGGLE = 'VIEW_TOGGLE',
  EXPERT_QA = 'EXPERT_QA',
  CLARIFY = 'CLARIFY',
  OUT_OF_SCOPE = 'OUT_OF_SCOPE'
}

export interface BaseResponseV2 {
  intent: IntentV2;
  message: string;
  confidence: number;
  session_id?: string;
  classification_source?: string;
}

export interface DSLResponsePayload {
  version_id: number;
  diagram_state: { nodes: any[]; edges: any[] };
  pinned_nodes?: string[];
}

export interface DSLResponse extends BaseResponseV2 {
  intent: IntentV2.DSL_CREATE | IntentV2.DSL_UPDATE;
  payload: DSLResponsePayload;
}

export interface ExpertQAResponse extends BaseResponseV2 {
  intent: IntentV2.EXPERT_QA;
  references?: { [key: string]: string }[];
}

export interface ViewToggleResponse extends BaseResponseV2 {
  intent: IntentV2.VIEW_TOGGLE;
  target_view: string;
  diagram_state?: any;
}

export interface ClarifyResponse extends BaseResponseV2 {
  intent: IntentV2.CLARIFY;
  questions: string[];
}

export interface OutOfScopeResponse extends BaseResponseV2 {
  intent: IntentV2.OUT_OF_SCOPE;
  suggestion?: string;
}

export type V2Response = DSLResponse | ExpertQAResponse | ViewToggleResponse | ClarifyResponse | OutOfScopeResponse;

export interface DesignServiceResponseV2 {
  response: V2Response;
}

export interface DesignGenerateRequestV2 {
  project_id: string;
  query: string;
  session_id?: string;
} 