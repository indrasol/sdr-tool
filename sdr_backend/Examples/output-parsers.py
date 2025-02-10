from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, CommaSeparatedListOutputParser, JsonOutputParser
from pydantic import BaseModel, Field
from dotenv import load_dotenv
load_dotenv()

llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0.7,
    )

def call_string_output_parser(parser):
    prompt = ChatPromptTemplate.from_messages([
        ("system" , "Extract Information from the following phrase. \nFormatting instructions : {format_instructions}"),
        ("human" , "{phrase}?")
    ])

    class Person(BaseModel):
        name: str = Field(description="The person's name")
        age: int = Field(description="The person's age")

    if  parser == "string":
        parser = StrOutputParser()
    elif parser == "list":
        parser = CommaSeparatedListOutputParser()
    elif parser == "json":
        parser = JsonOutputParser(pydantic_object=Person)

    chain = prompt | llm | parser

    return chain.invoke({"phrase": "Rithin is 25 years old", "format_instructions": parser.get_format_instructions()})

print(call_string_output_parser("json"))

