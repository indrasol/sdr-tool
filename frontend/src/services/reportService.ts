/* services/reportService.ts */
import { BASE_API_URL, getAuthHeaders } from './apiService';

/* ---------- API contract ---------- */
export interface ReportSection {
  title: string;
  content: string;
}

export interface GenerateReportResponse {
  report_id:       string;
  project_code:    string;
  generated_at:    string;          // ISO
  sections:        ReportSection[];
  diagram_url:     string | null;
  severity_counts: Record<string, number>;
}

/* The request body your backend expects */
export interface GenerateReportRequest {
  project_code:  string;            // required by backend
  session_id?:   string;
  diagram_state?: any;              // nodes / edges
  diagram_png?:  string;            // base64 with NO data-URL header
}

class ReportService {
  private baseUrl = BASE_API_URL;

  /**
   * POST /projects/{projectCode}/report
   *
   * @param projectCode path parameter
   * @param payload     body – see interface above
   */
  async generateReport(
    projectCode: string,
    payload: GenerateReportRequest
  ): Promise<GenerateReportResponse> {
    const res = await fetch(`${this.baseUrl}/projects/${projectCode}/report`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      /* try to surface backend message first */
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail ?? `HTTP ${res.status}`);
    }

    return res.json();
  }
}

export default new ReportService();
