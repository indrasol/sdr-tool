// utils/placeholderUtils.ts

/**
 * Returns an appropriate placeholder text based on the current state of the chat
 * 
 * @param hasMessages Whether there are existing messages in the chat
 * @param messagesSent Whether the user has sent any messages
 * @param hasInteracted Whether the user has interacted with the input
 * @returns Appropriate placeholder text as a string
 */
export const getPlaceholderText = (
    hasMessages: boolean, 
    messagesSent: boolean, 
    hasInteracted: boolean
  ): string => {
    if (!hasInteracted && !hasMessages) {
      return "How can Guardian AI help with your security architecture?";
    } else if (!messagesSent) {
      return "Ask a question or describe your security needs...";
    } else {
      return "Continue the conversation...";
    }
  };