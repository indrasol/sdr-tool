import { DesignGenerateRequestV2, DesignServiceResponseV2 } from '@/interfaces/aiassistedinterfaces_v2';
import { getAuthHeaders, BASE_API_URL, fetchWithTimeout, DEFAULT_TIMEOUT } from './apiService';

export const sendDesignGenerateRequest = async (
  request: DesignGenerateRequestV2,
  toast?: any,
  timeout: number = DEFAULT_TIMEOUT,
  signal?: AbortSignal,
  maxRetries = 3,
): Promise<DesignServiceResponseV2> => {
  const endpoint = `${BASE_API_URL}/generate`;

  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    // honour AbortSignal – bail out immediately if the caller aborted the request
    if (signal?.aborted) {
      const err = new Error('Request cancelled.');
      err.name = 'AbortError';
      throw err;
    }

    try {
      // Debug logs – capture endpoint and request details
      console.log('[DesignServiceV2] Endpoint:', endpoint);
      console.log('[DesignServiceV2] Request payload:', request);

      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal,
        },
        timeout,
      );

      if (!res.ok) {
        // Retry only on transient gateway errors
        if ([502, 503, 504].includes(res.status) && attempt < maxRetries - 1) {
          throw new Error(`Transient error ${res.status}`);
        }

        const errDetail = await res.json().catch(() => ({}));
        const msg = Array.isArray(errDetail?.errors)
          ? errDetail.errors.join('; ')
          : errDetail.detail || res.statusText;
        throw new Error(msg);
      }

      const data = await res.json();
      return data as DesignServiceResponseV2;
    } catch (err: any) {
      lastError = err;

      // Abort errors or explicit cancellation → stop immediately
      if (err.name === 'AbortError') {
        throw err;
      }

      // Retry path for transient errors
      if (attempt < maxRetries - 1) {
        const backoffMs = 500 * 2 ** attempt; // 0.5s, 1s, 2s
        await new Promise((r) => setTimeout(r, backoffMs));
        attempt += 1;
        continue;
      }
      // Max retries reached – propagate
      break;
    }
  }

  console.error('designService_v2 error', lastError);
  if (toast) {
    toast({ title: 'Request failed', description: lastError?.message || 'Error', variant: 'destructive' });
  }
  throw lastError;
}; 