// src/services/designService.ts
import { DesignRequest, DesignResponse, ResponseType, ArchitectureResponse, ExpertResponse, ClarificationResponse, OutOfContextResponse } from '@/interfaces/aiassistedinterfaces';
import tokenService from '@/services/tokenService';
import { getAuthHeaders, BASE_API_URL, fetchWithTimeout, DEFAULT_TIMEOUT } from './apiService'

// Get authenticated request headers
// const getAuthHeaders = () => {
//   const token = tokenService.getToken();
//   return {
//     'Authorization': `Bearer ${token}`,
//     'Content-Type': 'application/json',
//   };
// };

// const BASE_API_URL = import.meta.env.VITE_BASE_API_URL
// const BASE_API_URL = import.meta.env.VITE_DEV_BASE_API_URL;
// Default timeout for requests (60 seconds)
// const DEFAULT_TIMEOUT = 60000;

// Function to create a request with timeout
// const fetchWithTimeout = async (url: string, options: RequestInit, timeout = DEFAULT_TIMEOUT) => {
//   const controller = new AbortController();
//   const id = setTimeout(() => controller.abort(), timeout);
  
//   // Include the abort signal in the options
//   const optionsWithSignal = {
//     ...options,
//     signal: controller.signal
//   };
  
//   try {
//     const response = await fetch(url, optionsWithSignal);
//     clearTimeout(id);
//     return response;
//   } catch (error) {
//     clearTimeout(id);
//     if (error.name === 'AbortError') {
//       throw new Error('Request timed out. The operation might be taking too long to complete.');
//     }
//     throw error;
//   }
// };

export const sendDesignRequest = async (
  request: DesignRequest, 
  showThinking: boolean = true,
  timeout: number = DEFAULT_TIMEOUT
): Promise<DesignResponse> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('show_thinking', showThinking.toString());
    
    // Add complexity hint param to help the backend optimize
    if (request.diagram_state && 
        request.diagram_state.nodes && 
        request.diagram_state.nodes.length > 10) {
      // For complex diagrams, indicate to the backend this is complex
      queryParams.append('complexity', 'high');
    }
    
    console.log("Design Request : ", request);
    const response = await fetchWithTimeout(
      `${BASE_API_URL}/design?${queryParams.toString()}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      },
      timeout
    );

    // Handle different error cases
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication error. Please login again.');
    }

    if (response.status === 404) {
      throw new Error('API endpoint not found.');
    }
    
    if (response.status === 408 || response.status === 504) {
      throw new Error('The request timed out. Your query might be too complex or the server is busy. Try a simpler query or try again later.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Special handling for the streaming recommendation error
      if (errorData.detail && errorData.detail.includes('Streaming is strongly recommended')) {
        throw new Error('Your request is complex and may take a while to process. Please try a simpler query or contact support if this issue persists.');
      }
      
      throw new Error(errorData.detail || 'Network response was not ok');
    }

    // Parse and process the response to ensure it has the correct structure
    const responseData = await response.json();
    console.log("Raw response data:", responseData);

    // Create a properly structured DesignResponse object
    const designResponse: DesignResponse = {
      response: responseData.response,
      show_thinking: responseData.show_thinking,
      response_id: responseData.response_id
    };

    // Copy specific fields based on response type
    if (responseData.response?.response_type === ResponseType.ARCHITECTURE) {
      designResponse.diagram_updates = responseData.diagram_updates || {};
      designResponse.nodes_to_add = responseData.nodes_to_add || [];
      designResponse.edges_to_add = responseData.edges_to_add || [];
      designResponse.elements_to_remove = responseData.elements_to_remove || [];
    } else if (responseData.response?.response_type === ResponseType.EXPERT) {
      designResponse.references = responseData.references || [];
      designResponse.related_concepts = responseData.related_concepts || [];
    } else if (responseData.response?.response_type === ResponseType.CLARIFICATION) {
      designResponse.questions = responseData.questions || [];
    } else if (responseData.response?.response_type === ResponseType.OUT_OF_CONTEXT) {
      designResponse.suggestion = responseData.suggestion || undefined;
    }

    // Add type assertion for the response
    const typedResponse = buildTypedResponse(designResponse);
    console.log("Processed response:", typedResponse);
    
    return typedResponse;
  } catch (error) {
    console.error('Error in sendDesignRequest:', error);
    throw error;
  }
};

// Helper function to build a properly typed response object
function buildTypedResponse(response: DesignResponse): DesignResponse {
  // Make sure the response.response has the correct type
  if (response.response) {
    // Make specific type assertions based on response_type
    switch (response.response.response_type) {
      case ResponseType.ARCHITECTURE:
        // Ensure the response.response is properly typed as ArchitectureResponse
        (response.response as ArchitectureResponse).diagram_updates = response.diagram_updates;
        (response.response as ArchitectureResponse).nodes_to_add = response.nodes_to_add;
        (response.response as ArchitectureResponse).edges_to_add = response.edges_to_add;
        (response.response as ArchitectureResponse).elements_to_remove = response.elements_to_remove;
        break;
      case ResponseType.EXPERT:
        // Ensure the response.response is properly typed as ExpertResponse
        (response.response as ExpertResponse).references = response.references;
        (response.response as ExpertResponse).related_concepts = response.related_concepts;
        break;
      case ResponseType.CLARIFICATION:
        // Ensure the response.response is properly typed as ClarificationResponse
        (response.response as ClarificationResponse).questions = response.questions || [];
        break;
      case ResponseType.OUT_OF_CONTEXT:
        // Ensure the response.response is properly typed as OutOfContextResponse
        (response.response as OutOfContextResponse).suggestion = response.suggestion;
        break;
    }
  }

  return response;
}

// Optional: Add a function to handle simpler requests with shorter timeout
export const sendSimpleDesignRequest = (request: DesignRequest, showThinking: boolean = true) => {
  // For simpler queries, use a shorter timeout (15 seconds)
  return sendDesignRequest(request, showThinking, 15000);
};


