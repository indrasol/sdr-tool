# core/analysis.py

# This module handles the security analysis using LangChain and OpenAI. 
# You can customize the prompt to fit your needs.

from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain, SequentialChain
from langchain.schema import AIMessage

# from langchain.chains import LLMChain, SimpleSequentialChain
from config.settings import OPENAI_API_KEY
from core.retriever import retrieve_relevant_docs
from langchain.schema.runnable import RunnableLambda

import json

from config.settings import OPENAI_API_KEY
from core.retriever import retrieve_relevant_docs

from models.analysis_models import SecurityAnalysisResponse
import re


# (Optional) A cleaning function to sanitize the input text
def clean_input_text(text: str) -> str:
    cleaned_text = re.sub(r"[^\x00-\x7F]+", " ", text)  # Remove non-ASCII characters
    cleaned_text = re.sub(r"\s+", " ", cleaned_text)      # Replace multiple spaces with one
    return cleaned_text.strip()

def analyze_architecture(diagram_text: str) -> SecurityAnalysisResponse:
    print("------------------")
    print("Inside analyze_architecture")
     # Clean the input text (optional but recommended)
    cleaned_text = clean_input_text(diagram_text)
    print("------------------")
    print(f"Cleaned text inside analyze_architecture function: {cleaned_text}")
    if not cleaned_text:
        raise ValueError("Input text is empty after cleaning. Please provide valid text.")

   # Retrieve relevant security data using FAISS
    print("------------------")
    print("About to call retrieve_relevant_docs")  # Debugging line before function call
    print("------------------")
    relevant_docs = retrieve_relevant_docs(cleaned_text)
    print(f"Relevant docs retrieved: {relevant_docs}")
    print("------------------")

    print(f"Relevant docs retrieved: {relevant_docs}")  # Log the relevant docs
    
    if not relevant_docs:
        print("No relevant documents found. Passing to research_analyst with no context.")
        context = "No relevant security documents found. Please analyze the architecture based on the given diagram text alone."
        # raise ValueError("No relevant documents found. Please check the input or data source.")
    else:
        # Combine retrieved knowledge into a single context string
        context = "\n".join([doc["text"] for doc in relevant_docs])

    # # Combine retrieved knowledge into a single context string
    # context = "\n".join([doc["text"] for doc in relevant_docs])

    # Step 1: Extract Key Security Gaps and Assessments
    research_analyst_prompt = PromptTemplate(
        input_variables=["diagram_text", "context"],
        template=(
            "You are a cybersecurity expert. Here is a security architecture.\n"
            "Architecture Description:\n{diagram_text}\n\n"
            "Here is additional knowledge from security sources (CVE, MITRE, OWASP, STRIDE, PASTA):\n"
            "{context}\n\n"
            "Identify the key security weaknesses, missing controls, and list the types of assessments performed. "
            "Provide a summary along with assessment names. "
            "Then, list the identified security gaps with preliminary risk levels and recommendations."
        )
    )

    # Step 2: Provide Recommendations and Return a JSON Structure
    security_consultant_prompt = PromptTemplate(
        input_variables=["summary","analysis"],
        template=(
            "Based on the analysis provided below:\n"
            "Summary:\n{summary}\n\n"
            "Detailed Analysis:\n{analysis}\n\n"
            "Return ONLY a valid JSON object that exactly conforms to this structure:\n\n"
            "{{\n"
            '  "summary": "{summary}",\n'
            '  "assessments": [\n'
            "    {{\n"
            '      "name": "<assessment name>",\n'
            '      "gaps": [\n'
            "        {{\n"
            '          "gap": "<identified gap>",\n'
            '          "risk_level": "<risk level>",\n'
            '          "recommendations": ["<recommendation 1>", "<recommendation 2>"],\n'
            '          "sources": ["<source1>", "<source2>"]\n'
            "        }}\n"
            "      ]\n"
            "    }}\n"
            "  ]\n"
            "}}\n\n"
            "Output ONLY the JSON object. Do not include any extra text or numbers."
        )
    )

    # Initialize LLM (using GPT-4o or your desired model)
    llm = ChatOpenAI(model="gpt-4", temperature=0.4, openai_api_key=OPENAI_API_KEY)

    from langchain.schema.runnable import RunnableLambda

    # Define the research analyst chain using RunnableSequence
    research_analyst = (
    research_analyst_prompt | llm | RunnableLambda(lambda output: {"summary": output.content, "analysis": output.content})
    )


    # Define the security consultant chain using RunnableSequence
    security_consultant = (
        security_consultant_prompt | llm | RunnableLambda(lambda output: {"json_output": output})
    )

    # Chain them together
    security_solutions_architect = research_analyst | security_consultant

    print("------------------")
    print(f"Cleaned diagram_text: {cleaned_text}")
    print("------------------")
    print(f"Context: {context}")

     # Run the chain with the provided diagram text and context
    try:
        secure_solution_json = security_solutions_architect.invoke({"diagram_text": cleaned_text, "context": context})
    except Exception as e:
        raise ValueError(f"Error during analysis chain execution: {e}")
    
    # Log the result before parsing to understand the format
    print("------------------")
    print(f"LLM Output: {secure_solution_json}")
    print("------------------")

    # Ensure AIMessage is properly handle
    secure_solution_output = secure_solution_json.get("json_output")

    # Ensure AIMessage is properly handle
    if isinstance(secure_solution_output, AIMessage):
        secure_solution_output = secure_solution_output.content 

    # Validate that the output looks like a JSON object
    if not isinstance(secure_solution_output, str) or not secure_solution_output.strip().startswith("{"):
        raise ValueError(f"Unexpected LLM output. Expected JSON object but received: {secure_solution_output}")

    # Attempt to parse the result as JSON and load it into our Pydantic model
    try:
        secure_solution = json.loads(secure_solution_output)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON output from LLM: {e}. Output was: {secure_solution}")

    # Validate the JSON with the Pydantic model
    try:
        return SecurityAnalysisResponse.model_validate(secure_solution)
    except Exception as e:
        raise ValueError(f"Invalid structure in the JSON output: {e}. Output was: {secure_solution}")

