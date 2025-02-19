import DOMPurify from 'dompurify';
import { Message } from '@/utils/types';
// 1. HELPER FUNCTIONS FOR MERGING
export function mergeNodes(
    currentNodes: any[], 
    backendNodes: { add: any[]; update: any[]; remove: any[] }
  ) {
    // Create a map of existing nodes by ID
    const nodesMap = new Map(currentNodes.map(n => [n.id, n]));
    
    // Remove nodes
    backendNodes.remove.forEach((nodeToRemove) => {
      nodesMap.delete(nodeToRemove.id);
    });
  
    // Add nodes
    backendNodes.add.forEach((nodeToAdd) => {
      nodesMap.set(nodeToAdd.id, nodeToAdd);
    });
  
    // Update nodes
    backendNodes.update.forEach((nodeToUpdate) => {
      nodesMap.set(nodeToUpdate.id, nodeToUpdate);
    });
  
    // Convert map back to array
    return Array.from(nodesMap.values());
  }
  
export function mergeEdges(
currentEdges: any[], 
backendEdges: { add: any[]; remove: any[] }
) {
const edgesMap = new Map(currentEdges.map(e => [e.id, e]));

// Remove edges
backendEdges.remove.forEach((edgeToRemove) => {
    edgesMap.delete(edgeToRemove.id);
});

// Add edges
backendEdges.add.forEach((edgeToAdd) => {
    edgesMap.set(edgeToAdd.id, edgeToAdd);
});

return Array.from(edgesMap.values());
}

// 2. HELPER FUNCTIONS FOR PARSING RESPONSES
export function parseExpertResponse(response: any, headingLevel = 0): string {

/**
 * Recursively parses a nested JSON object (or array/string)
 * into a nicely formatted string using Markdown-style headings
 * and bullet points.
 *
 * Example usage with the given expert_message:
 *   const formattedText = parseExpertResponse(expert_message);
 */

  // If the response is just a string, return it with a newline.
  if (typeof response === "string") {
    // Detect if string is a code snippet (basic heuristic)
    if (response.includes("\n") && response.match(/\b(function|const|let|var|if|else|return)\b/)) {
      return `\n\n\`\`\`javascript\n${response}\n\`\`\`\n\n`;
    }
    return `\n${response}\n`;
  }

  // If the response is an array, format each item as a bullet point.
  if (Array.isArray(response)) {
    return response
      .map((item) => `- ${parseExpertResponse(item, headingLevel + 1).trim()}`)
      .join('\n');
  }

  // If it's an object, create a heading for each key and parse its value.
  if (typeof response === "object" && response !== null) {
    let result = "";

    for (const [key, value] of Object.entries(response)) {
      const formattedKey = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      if (headingLevel === 0) {
        result += `\n\n## ${formattedKey}\n\n`; // H2 for main sections
      } else {
        result += `\n**${formattedKey}**\n`; // Bold for subsections
      }

      result += parseExpertResponse(value, headingLevel + 1).trim() + "\n";
    }

    return result;
  }

  return "";
}

export function sanitizeResponse(response) {
  return DOMPurify.sanitize(response);
}


export const typeMessage = (message: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>, onComplete: () => void) => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < message.length) {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          const newMessage = { ...lastMessage, content: message.slice(0, i + 1) };
          return [...prev.slice(0, -1), newMessage];
        });
        i++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 10); // 100ms for each character, adjust speed here
  };
  
  