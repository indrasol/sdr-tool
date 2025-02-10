from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import create_retrieval_chain
from dotenv import load_dotenv
load_dotenv()


# Get documents from web
def get_documents_from_web(url):
    loader = WebBaseLoader(url)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=200,
        chunk_overlap=20
    )
    splitDocs = splitter.split_documents(docs)
    print(len(splitDocs))
    return splitDocs


# Create Embeddings and vector store
def create_vector_store(docs):
    embeddings = OpenAIEmbeddings()
    vector_store = FAISS.from_documents(docs, embeddings)
    return vector_store

def create_chain(vector_store):
    llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0.4,
    )

    prompt = ChatPromptTemplate.from_template(
        """
        Answer the user's question based on the context provided:
        Context: {context}
        Question: {input}
        """
    )

    chain = create_stuff_documents_chain(
        llm=llm,
        prompt=prompt,
    )

    retriever = vector_store.as_retriever(search_kwargs={"k": 2})
    retrieval_chain = create_retrieval_chain(retriever, chain) #retriever parameter accepts create_stuff_documents_chain
    return retrieval_chain


# Source - Get documents from web and chunk them
docs = get_documents_from_web("https://python.langchain.com/docs/introduction/")

# Embeddings and Vector Store
vector_store = create_vector_store(docs)

# Create Chain with prompt and llm with vector store
# chain = create_chain(vector_store)


# chain = prompt | llm
response = create_chain(vector_store).invoke({
    "input": "What all I can integrate with Langchain?"
})

# Print the full response to debug
print("Full response:", response)

# Access metadata from the response
context = response.get("context", [])

# Iterate over the context to access metadata
for doc in context:
    metadata = doc.metadata
    print("--------")
    print(type(metadata))
    print("--------")
    print(metadata)
    print("--------")

# Example of accessing specific keys inside metadata
    source = metadata.get("source", "No source found")
    title = metadata.get("title", "Langchain")
    print("Source:", source)
    print("Title:", title)

