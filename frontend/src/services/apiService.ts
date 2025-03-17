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

// default timeout for requests (60 seconds)
export const DEFAULT_TIMEOUT = 60000
export const fetchWithTimeout = async (url: string, options: RequestInit, timeout = DEFAULT_TIMEOUT) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    // Include the abort signal in the options
    const optionsWithSignal = {
      ...options,
      signal: controller.signal
    };
    
    try {
      const response = await fetch(url, optionsWithSignal);
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. The operation might be taking too long to complete.');
      }
      throw error;
    }
  };