import { DataFlowRequest, DataFlowResponse } from '@/types/dataFlowTypes';
import { getAuthHeaders, BASE_API_URL, fetchWithTimeout, DEFAULT_TIMEOUT } from './apiService';

export const fetchDataFlow = async (
  body: DataFlowRequest,
  timeout: number = DEFAULT_TIMEOUT,
  toast?: any,
): Promise<DataFlowResponse> => {
  try {
    console.log('Sending /data-flow request', body);
    const response = await fetchWithTimeout(
      `${BASE_API_URL}/data-flow`,
      {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      timeout,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.detail || response.statusText;
      if (toast) {
        toast({ title: 'Error', description: detail, variant: 'destructive' });
      }
      throw new Error(detail);
    }

    const data = (await response.json()) as DataFlowResponse;
    console.log('Received /data-flow response', data);
    return data;
  } catch (error: any) {
    if (toast) {
      toast({ title: 'Request Failed', description: error.message, variant: 'destructive' });
    }
    throw error;
  }
};

export const fetchFlowchart = async (
  body: DataFlowRequest,
  timeout: number = DEFAULT_TIMEOUT,
  toast?: any,
): Promise<DataFlowResponse> => {
  try {
    console.log('Sending /data-flow/flowchart request', body);
    const response = await fetchWithTimeout(
      `${BASE_API_URL}/data-flow/flowchart`,
      {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      timeout,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.detail || response.statusText;
      if (toast) {
        toast({ title: 'Error', description: detail, variant: 'destructive' });
      }
      throw new Error(detail);
    }

    const data = (await response.json()) as DataFlowResponse;
    console.log('Received /data-flow/flowchart response', data);
    return data;
  } catch (error: any) {
    if (toast) {
      toast({ title: 'Request Failed', description: error.message, variant: 'destructive' });
    }
    throw error;
  }
}; 