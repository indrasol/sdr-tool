import { BASE_API_URL, getAuthHeaders, fetchWithTimeout, DEFAULT_TIMEOUT } from './apiService';

export interface UserMessage {
  id: number | null; 
  content: string;
  timestamp: string;
  changed: boolean;
  has_diagram_state: boolean;
}

export interface HistoryResponse {
  messages: UserMessage[];
}

// Service for managing project history API interactions
const projectHistoryService = {
  /**
   * Fetches user message history for a project
   * @param projectId The project ID to fetch history for
   * @param days Number of days to look back (default: 10)
   * @param ignoreCache Whether to add a cache-busting parameter (default: false)
   * @returns Promise with an array of user messages
   */
  async getProjectHistory(projectId: string, days: number = 10, ignoreCache: boolean = false): Promise<UserMessage[]> {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      
      // Add a cache-busting parameter if ignoreCache is true
      const cacheBuster = ignoreCache ? `&_t=${Date.now()}` : '';
      
      const response = await fetchWithTimeout(
        `${BASE_API_URL}/projects/${projectId}/history?days=${days}${cacheBuster}`,
        { 
          method: 'GET',
          headers: getAuthHeaders() 
        },
        30000 // 30 second timeout, as history can be large
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch project history: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      // Dispatch event to notify any interested components about updated history
      const historyUpdatedEvent = new CustomEvent('historyUpdated', { 
        detail: { 
          projectId,
          count: data.messages.length,
          timestamp: Date.now()
        } 
      });
      window.dispatchEvent(historyUpdatedEvent);
      
      return data.messages;
    } catch (error) {
      console.error('Error fetching project history:', error);
      throw error;
    }
  },
  
  /**
   * Reverts to a specific message's diagram state
   * @param projectId The project ID
   * @param messageId The message ID to revert to
   * @returns Promise with revert result data including diagram state
   */
  async revertToMessage(projectId: string, messageId: number): Promise<any> {
    try {
      if (!projectId || !messageId) {
        throw new Error('Project ID and Message ID are required');
      }
      
      console.log(`Reverting project ${projectId} to message ${messageId}`);
      
      const response = await fetchWithTimeout(
        `${BASE_API_URL}/projects/${projectId}/revert/${messageId}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}) // Empty body
        },
        DEFAULT_TIMEOUT // Use default timeout for this operation
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to revert to message: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Revert operation completed successfully, refreshing history');
      
      // After a successful revert, immediately refresh the project history
      try {
        // Dispatch an event to notify components to refresh history
        const revertCompletedEvent = new CustomEvent('revertCompleted', { 
          detail: { 
            projectId,
            messageId,
            timestamp: Date.now() 
          } 
        });
        window.dispatchEvent(revertCompletedEvent);
        
        // Wait a moment to allow the backend to process the revert fully
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Now fetch the updated history with cache busting
        await this.getProjectHistory(projectId, 10, true);
        
        // Schedule another refresh after a delay to catch any new messages
        setTimeout(async () => {
          console.log('Performing follow-up history refresh after revert');
          await this.getProjectHistory(projectId, 10, true);
        }, 2000);
      } catch (refreshError) {
        console.warn('Could not refresh history after revert:', refreshError);
        // Continue anyway, as the revert was successful
      }
      
      return result;
    } catch (error) {
      console.error('Error reverting to message:', error);
      throw error;
    }
  }
};

export default projectHistoryService; 