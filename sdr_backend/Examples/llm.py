# from langchain import LangChain
# from langcorn import LangCorn
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
load_dotenv() # Load environment variables from .env file


llm = ChatOpenAI(
    model="gpt-3.5-turbo", # Set the model to use
    temperature=0.7,  # Set temperature close to 0 for more factual based responses (retrieving from database). Close to 1 for more creative response
    # max_tokens=1000, # Set max_tokens to limit the response length
    # verbose=True # Set verbose to True to see the request and response (debug the model)
    )

#Prompt Template
# 1. Using from_template method
# prompt = ChartPromptTemplate.from_template("What is the capital of {country}?")

# 2. Using from_template method
prompt = ChatPromptTemplate.from_messages(
    [
        ("system" , "Generate a list of 10 synonyms for following word. Return the results as a comma separated list"),
        ("human" , "{word}?")
    ]
)

#LLM Chain
chain = prompt | llm # Pass the output from prompt to the llm

response = chain.invoke({"word": "chatgpt"})
print(response.content)

# Ways to call the llms

# 1. Call the LLM through invoke method - takes a single prompt
# response = llm.invoke("What is the capital of France?")
# print(response)

# 2. Call the LLM through batch method - takes list of prompts (prompts are run in parallel)
# response = llm.batch(["What is the capital of France?","What is the capital of Germany?"])
# print(response)

# 3. Call the LLM through stream method - takes a single prompt and returns a generator (streaming response) which can be used by for loop
# response = llm.stream("What is the capital of France?")
# for chunk in response:
#     print(chunk.content,end="",flush=True)

# Define your retrieval function
def retrieve_documents(query):
    # This is a placeholder for your document retrieval logic
    # Replace with your actual retrieval code
    documents = [
        "Document 1 content related to " + query,
        "Document 2 content related to " + query,
    ]
    return documents

# Define your generation function
def generate_response(documents, query):
    # This is a placeholder for your generation logic
    # Replace with your actual generation code
    response = "Generated response based on documents: " + ", ".join(documents)
    return response

# Define your RAG function
def rag(query):
    documents = retrieve_documents(query)
    response = generate_response(documents, query)
    return response

# Initialize LangCorn
# lcorn = LangCorn()

# Define your LangCorn endpoint
# @lcorn.endpoint("/rag")
# def rag_endpoint(request):
#     query = request.json.get("query")
#     response = rag(query)
#     return {"response": response}

# Run the LangCorn app
# if __name__ == "__main__":
#     lcorn.run()