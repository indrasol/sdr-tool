
from langchain.schema.runnable import RunnableSequence  # Alternative import
from utils.llm_model import get_openai_model_chain, get_prompt_template
from utils.prompts import get_intent_prompt
from utils.logger import log_info, log_error

# intent_template = PromptTemplate(
#     input_variables=["user_input"],
#     template="Classify this user intent: {user_input}. Options: [Add, Update, Remove, Query]. Only return the intent name."
# )

async def classify_intent(message: str) -> str:
    """
    Uses LLM to classify user intent into:
    - 'add' (Create new nodes)
    - 'update' (Modify existing nodes)
    - 'remove' (Delete nodes)
    - 'query' (General cybersecurity question)
    """
    try:
        system_message ="""
        You are an AI specialized in classifying user intents. 
        Based on the input, categorize it into:
        - 'add': If the user wants to create a new node or concept.
        - 'update': If the user wants to modify existing elements.
        - 'remove': If the user wants to delete something.
        - 'query': If the user is asking a general cybersecurity question.

        Only return the category in lowercase without explanations.
        """

        user_message = message
        prompt = get_prompt_template(system_message, user_message)
        chain = get_openai_model_chain(model_name="gpt-4o", temperature=0.3, prompt=prompt)
        response = chain.invoke({"user_input": message})
        log_info(f"Response from classify_intent: {response}")

        cleaned_response = response.content.strip().lower()
        log_info(f"Cleaned response from classify_intent: {cleaned_response}")

        return cleaned_response

    except Exception as e:
        log_error(f"Error in intent classification: {e}")
        raise ValueError(f"Failed to classify intent: {e}")
    intent_prompt = get_intent_prompt()
    # try:
    #     intent = llm(intent_template.format(user_input=message))
    #     return {"intent": intent.strip()}
    # Create the prompt template with escaped curly braces for JSON
    # PROMPT_INTENT_TEMPLATE = PromptTemplate.from_template(intent_prompt)
    # try:
        
    #     logger.info("--------------------------------")
    #     intent_chain = PROMPT_INTENT_TEMPLATE | model
    #     logger.info(f"intent_chain: {intent_chain}")
        
    #     intent_chain_output = await intent_chain.ainvoke({"user_message": message})
    #     logger.info("--------------------------------")
    #     logger.info(f"intent chain output: {intent_chain_output}")
    #     logger.info("--------------------------------")
        
    #     try:
    #         # Extract content from AIMessage
    #         intent_response = intent_chain_output.content if hasattr(intent_chain_output, 'content') else str(intent_chain_output)
            
    #         logger.info(f"intent_response : {intent_response}")
    #         logger.info("--------------------------------")

    #         #  # Clean the response string
    #         cleaned_response = intent_response.strip()
    #         if cleaned_response.startswith('```json'):
    #             cleaned_response = cleaned_response[7:]  # Remove ```json
    #         if cleaned_response.endswith('```'):
    #             cleaned_response = cleaned_response[:-3]  # Remove closing ```
    #         cleaned_response = cleaned_response.strip()

    #         # # Replace escaped newlines and backslashes
    #         # cleaned_response = cleaned_response.replace('\\n', ' ')
    #         # cleaned_response = cleaned_response.replace('\\', '')
    #         # cleaned_response = cleaned_response.replace('n{n', '{')
    #         # cleaned_response = cleaned_response.replace('}n', '}')

    #         # Replace escaped backslashes
    #         # cleaned_response = cleaned_response.replace('\\', '')
    #         logger.info("--------------------------------")
            
    #         logger.info(f"cleaned intent response: {cleaned_response}")
    #         logger.info("--------------------------------")
    #         parsed_eval = json.loads(cleaned_response)
    #         logger.info(f"parsed_eval: {parsed_eval}")
    #         logger.info("--------------------------------")
            
    #         # Validate the evaluation response
    #         required_fields = ["intent"]
    #         if not all(field in parsed_eval for field in required_fields):
    #             raise ValueError("Missing required fields in evaluation response")
            
    #         # Log the enhanced system prompt
    #         # logger.info(f"Generated refined prompt: {parsed_eval['refined_prompt']}")
    #         # langsmith_logger.log_response(parsed_eval['system_prompt'], {"stage": "prompt_enhancement"})
            
    #         return {
    #             "intent": parsed_eval["intent"],
    #             "nodeType": parsed_eval["nodeType"],
    #             "nodeName": parsed_eval["nodeName"],
    #             "connectFrom": parsed_eval["connectFrom"],
    #             "connectTo": parsed_eval["connectTo"],
    #             "updatedProperties": parsed_eval["updatedProperties"],
    #             "scope": parsed_eval["scope"]
    #         }
            
    #     except json.JSONDecodeError as e:
    #         logger.error(f"Failed to parse evaluation result: {e}")
    #         raise ValueError(f"Invalid evaluation response format: {e}")
            
    # except Exception as e:
    #     logger.error(f"Error in prompt evaluation: {e}")
    #     raise ValueError(f"Failed to evaluate prompt: {e}")