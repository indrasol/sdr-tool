import tokenService from './tokenService'


export const getAuthHeaders = () => {
    const token = tokenService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

export const BASE_API_URL = import.meta.env.VITE_BASE_API_URL
// export const BASE_API_URL = import.meta.env.VITE_DEV_BASE_API_URL

// Default timeout for requests. 150 000 ms (150 s) keeps the client connection
// open slightly longer than the LLM back-end timeout (120 s) so that legitimate
// long-running requests are not aborted by the browser.
export const DEFAULT_TIMEOUT = 150000
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT,
) => {
  // Controller used to enforce the timeout. If caller supplied a signal we
  // merge both signals so either one can abort the request.
  const timeoutController = new AbortController();

  // When timeout expires → abort
  const timer = setTimeout(() => timeoutController.abort(), timeout);

  // If the caller provided a signal, propagate its abort to our controller
  if (options.signal) {
    const callerSignal = options.signal as AbortSignal;
    if (callerSignal.aborted) {
      timeoutController.abort();
    } else {
      callerSignal.addEventListener('abort', () => timeoutController.abort());
    }
  }

  const responseSignal = timeoutController.signal;

  try {
    const response = await fetch(url, { ...options, signal: responseSignal });
    clearTimeout(timer);
    return response;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      // Distinguish between caller cancel vs timeout for better UX
      const reason = options.signal?.aborted ? 'Request cancelled.' : 'Request timed out.';
      throw new Error(reason);
    }
    throw err;
  }
};
