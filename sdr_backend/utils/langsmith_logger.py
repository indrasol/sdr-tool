
from langsmith import Client
from config.settings import LANGSMITH_API_KEY


langsmith_client = Client(api_key=LANGSMITH_API_KEY)

def log_conversation(user_input, enhanced_prompt, response):
    langsmith_client.log_interaction(
        input=user_input,
        modified_input=enhanced_prompt,
        output=response
    )