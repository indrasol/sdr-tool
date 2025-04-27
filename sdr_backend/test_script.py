# Using Python to generate a secure random key
import secrets
import requests
import anthropic
from config.settings import ANTHROPIC_API_KEY, OPENAI_API_KEY
from core.llm.model_mapping import MODEL_MAPPING
from openai import OpenAI

def test_anthropic(timeout):
    #  Configure client options

    print("API KEY",ANTHROPIC_API_KEY)

    client_options = {}
    if timeout is not None:
        client_options["timeout"] = timeout
    
    model = "claude-3-7-sonnet-20250219"
    # Using non-streaming

    anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    message = anthropic_client.messages.create(
        model=MODEL_MAPPING["anthropic"]["claude-3.7-sonnet"],
        max_tokens=1000,
        temperature=0.8,
        messages=[
            {"role": "user", "content": "Explain zero trust architecture"}
        ],
        **client_options
    )
    
    content = message.content[0].text
    return print(content)

def test_openai(timeout):
    #  Configure client options

    # print("API KEY",ANTHROPIC_API_KEY)

    client_options = {}
    if timeout is not None:
        client_options["timeout"] = timeout
    

    model_name = "gpt-4.1-mini"
    models = MODEL_MAPPING["openai"]
    model = models[model_name]
    # Using non-streaming

    client = OpenAI(api_key=OPENAI_API_KEY)
    completion = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "user", "content": "I am testing to check if you are working fine or not"}
                    ],
                    temperature=0.5,
                    max_tokens=1000,
                    timeout=60  # 1 minute
                )
    
    content = ""
    if hasattr(completion, 'choices') and len(completion.choices) > 0:
        choice = completion.choices[0]
        if hasattr(choice, 'message') and hasattr(choice.message, 'content'):
            content = choice.message.content
    return print(content)


test_openai(30000)