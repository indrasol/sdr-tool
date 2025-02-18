
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate



def get_openai_model_chain(model_name: str = "gpt-4o", temperature: float = 0.5, prompt: ChatPromptTemplate = None):
    model = ChatOpenAI(model=model_name, temperature=temperature)
    chain = prompt | model
    return chain

def get_prompt_template(system_message: str = "", user_message: str = ""):
    prompt = ChatPromptTemplate.from_messages([system_message, user_message])
    return prompt