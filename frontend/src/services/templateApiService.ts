import { BASE_API_URL, getAuthHeaders } from './apiService';

export interface SaveTemplateRequest {
  tenant_id: number;
  tenant_name: string;
  diagram_state: any;
  template_name: string;
  template_description: string;
  template_tags: string[];
  template_visibility: string[];
}

export interface SaveTemplateResponse {
  success: boolean;
  template_id: string;
  message: string;
}

export interface GetTemplateResponse {
  success: boolean;
  template_id: string;
  tenant_id: number;
  tenant_name: string;
  diagram_state: any;
  template_name: string;
  template_description?: string;
  template_tags: string[];
  template_visibility: string[];
  created_at: string;
  updated_at: string;
}

class TemplateApiService {
  private baseUrl = BASE_API_URL;

  async saveTemplate(payload: SaveTemplateRequest): Promise<SaveTemplateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/save_template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }

  async getTemplate(templateId: string, tenantId: number): Promise<GetTemplateResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/get_template?template_id=${encodeURIComponent(templateId)}&tenant_id=${tenantId}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  }
}

const templateApiService = new TemplateApiService();
export default templateApiService; 