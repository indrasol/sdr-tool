// src/services/designService.ts
import { DesignRequest, DesignResponse, ResponseType, ArchitectureResponse, DFDData, ExpertResponse, ClarificationResponse, OutOfContextResponse, DFDGenerationStartedResponse, DFDSwitchRequest, FullThreatModelResponse, ThreatsResponse } from '@/interfaces/aiassistedinterfaces';
import tokenService from '@/services/tokenService';
import { getAuthHeaders, BASE_API_URL, fetchWithTimeout, DEFAULT_TIMEOUT } from './apiService'

export type DesignServiceResponse = DesignResponse | DFDGenerationStartedResponse;

export const sendDesignRequest = async (
  request: DesignRequest, 
  showThinking: boolean = true,
  timeout: number = DEFAULT_TIMEOUT,
  toast?: any // Add optional toast parameter
): Promise<DesignServiceResponse> => {

  try {
    const queryParams = new URLSearchParams();
    queryParams.append('show_thinking', showThinking.toString());

    // Ensure view_mode is always included in the request body
    const body = { ...request };
    if (!body.view_mode) {
      body.view_mode = 'AD'; // Default to AD if not provided
    }
    
    console.log("Sending Design Request : ", request);

    const response = await fetchWithTimeout(
      `${BASE_API_URL}/design?${queryParams.toString()}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      },
      timeout
    );

    // --- Handle Specific Status Codes ---

    // 202 Accepted: DFD Generation Started
    if (response.status === 202) {
      const data = await response.json();
      console.log("DFD Generation Started:", data);
      // Return the specific response type for 202
      return {
        message: data.message || "DFD generation process started.",
        project_code: data.project_code || request.project_id,
        detail: data.detail || "The threat model is being generated in the background.",
        status: 202 // Add status for easy checking later
      } as DFDGenerationStartedResponse; // Type assertion
    }

    // Handle Authentication Errors
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication error. Please login again.');
    }

    // Handle Not Found
    if (response.status === 404) {
      throw new Error('API endpoint not found.');
    }
    
    // Handle Timeouts indicated by gateway/server
    if (response.status === 408 || response.status === 504) {
      throw new Error('The request timed out. Your query might be too complex or the server is busy. Try a simpler query or try again later.');
    }

    // Handle other non-OK responses (including 400, 500, 503 etc.)
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

    // Basic validation
    if (!responseData || !responseData.response || !responseData.response.response_type) {
      console.error("Invalid response structure received:", responseData);
      // Only show toast if it was provided
      if (toast) {
        toast({ title: "Error", description: "Received an invalid response from the server.", variant: "destructive" });
      }
      throw new Error("Invalid response structure");
    }

    // Create a properly structured DesignResponse object
    const designResponse: DesignResponse = {
      response: responseData.response,
      show_thinking: responseData.show_thinking,
      response_id: responseData.response_id,
      // top-level fields only if they exist in the raw response
      ...(responseData.diagram_updates && { diagram_updates: responseData.diagram_updates }),
      ...(responseData.nodes_to_add && { nodes_to_add: responseData.nodes_to_add }),
      ...(responseData.edges_to_add && { edges_to_add: responseData.edges_to_add }),
      ...(responseData.elements_to_remove && { elements_to_remove: responseData.elements_to_remove }),
      ...(responseData.references && { references: responseData.references }),
      ...(responseData.related_concepts && { related_concepts: responseData.related_concepts }),
      ...(responseData.questions && { questions: responseData.questions }),
      ...(responseData.suggestion && { suggestion: responseData.suggestion }),
    };

    // Add type assertion for the response
    const typedResponse = buildTypedResponse(designResponse);
    console.log("Processed response:", typedResponse);
    
    return typedResponse;
  } catch (error) {
    console.error('Error in sendDesignRequest:', error);
    // Avoid duplicate toasts if already handled specific statuses and toast is provided
    if (toast && !(error instanceof Error && (error.message.includes('Authentication error') || error.message.includes('timed out') || error.message.includes('API endpoint not found')))) {
      toast({ title: "Request Failed", description: error.message || "An unknown error occurred", variant: "destructive" });
    }
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
export const sendSimpleDesignRequest = (request: DesignRequest, showThinking: boolean = true, toast?: any) => {
  // For simpler queries, use a shorter timeout (15 seconds)
  return sendDesignRequest(request, showThinking, 15000, toast);
};

// Service function to get Threat Model
export const getThreatModel = async (projectCode: string, toast?: any): Promise<DFDData> => {
  try {
      const response = await fetchWithTimeout(
          `${BASE_API_URL}/projects/${projectCode}/threatmodel`,
          {
              method: 'GET',
              headers: getAuthHeaders(),
          },
          DEFAULT_TIMEOUT // Use standard timeout
      );

      if (response.status === 404) {
            // Don't throw error, return null or specific object to indicate not found
            console.log(`Threat model not found for project ${projectCode}`);
            // It's better to handle this in the component, throw for actual errors
            throw new Error('Threat model not generated yet.');
      }

      if (response.status === 401 || response.status === 403) {
            if (toast) {
                toast({ title: "Authentication Error", description: "Please login again.", variant: "destructive" });
            }
            throw new Error('Authentication error.');
      }

      if (!response.ok) {
          let errorDetail = `Failed to fetch threat model: ${response.statusText}`;
          try {
              const errorData = await response.json();
              errorDetail = errorData.detail || JSON.stringify(errorData);
          } catch (e) { /* Ignore JSON parsing error */ }
          if (toast) {
              toast({ title: "Error", description: errorDetail, variant: "destructive" });
          }
          throw new Error(errorDetail);
      }

      // Parse the response data
      const data = await response.json();
      console.log('Threat model data:', data);
      return data as DFDData;
  } catch (error) {
      console.error('Error in getThreatModel:', error);
        if (!error.message.includes('Threat model not generated yet.')) {
            if (toast) {
                toast({ title: "Error Fetching DFD", description: error.message || "Could not retrieve threat model", variant: "destructive" });
            }
        }
      throw error; // Re-throw
  }
};

// Function to generate threat model directly
export const generateThreatModel = async (
    projectCode: string, 
    request: DFDSwitchRequest,
    toast?: any
): Promise<FullThreatModelResponse> => {
    try {
        console.log(`Generating threat model for project ${projectCode}`, request);
        
        const response = await fetchWithTimeout(
            `${BASE_API_URL}/projects/${projectCode}/generate-threatmodel`,
            {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(request)
            },
            120000 // 2 minute timeout for threat model generation
        );

        console.log('Threat Model Response:', response);
        
        if (!response.ok) {
            let errorDetail = `Failed to generate threat model: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorDetail = errorData.detail || JSON.stringify(errorData);
            } catch (e) { /* Ignore JSON parsing error */ }
            
            if (toast) {
                toast({ title: "Error", description: errorDetail, variant: "destructive" });
            }
            throw new Error(errorDetail);
        }
        
        const threatModelResponse = await response.json();
        console.log('Generated threat model:', threatModelResponse);
        
        return threatModelResponse as FullThreatModelResponse;
    } catch (error) {
        console.error('Error generating threat model:', error);
        if (toast) {
            toast({ 
                title: "Error Generating Threat Model", 
                description: error.message || "Could not generate threat model",
                variant: "destructive" 
            });
        }
        throw error;
    }
};

// Function to run threat analysis
export const runThreatAnalysis = async (
  projectCode: string,
  request: DFDSwitchRequest,
  toast?: any
): Promise<ThreatsResponse> => {
  try {
    console.log(`Running threat analysis for project ${projectCode}`, request);
    
    const response = await fetchWithTimeout(
      `${BASE_API_URL}/projects/${projectCode}/threat_analysis`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      },
      120000 // 2 minute timeout for threat analysis
    );

    console.log('Threat Analysis Response:', response);
    
    if (!response.ok) {
      let errorDetail = `Failed to run threat analysis: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || JSON.stringify(errorData);
      } catch (e) { /* Ignore JSON parsing error */ }
      
      if (toast) {
        toast({ 
          title: "Error", 
          description: errorDetail, 
          variant: "destructive" 
        });
      }
      throw new Error(errorDetail);
    }
    
    const threatAnalysisResponse = await response.json();
    console.log('Threat analysis result:', threatAnalysisResponse);
    
    return threatAnalysisResponse as ThreatsResponse;
  } catch (error) {
    console.error('Error running threat analysis:', error);
    if (toast) {
      toast({ 
        title: "Error Running Threat Analysis", 
        description: error.message || "Could not complete threat analysis",
        variant: "destructive" 
      });
    }
    throw error;
  }
};
