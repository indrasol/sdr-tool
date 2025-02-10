import json
import os
import faiss
import numpy as np
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from config.settings import OPENAI_API_KEY, VECTOR_DB_PATH
from knowledge_base.fetch_knowledge_data import fetch_cve_data, load_security_data
from langchain.storage import InMemoryStore as InMemoryDocstore
from langchain.schema import Document

# Initialize OpenAI Embedding Model
embeddings = OpenAIEmbeddings(api_key=OPENAI_API_KEY)

class SimpleDocstore:
    """
    A minimal dictionary-like wrapper to provide a docstore interface.
    """
    def __init__(self, docs):
        self.docs = docs

    def __getitem__(self, key):
        return self.docs[key]

    def keys(self):
        return list(self.docs.keys())

# --- Helper Function to Build Documents ---

def build_documents():
    """
    Build a mapping of document IDs to Document objects from security data.
    
    Returns:
        tuple: (documents, texts, metadata)
            documents: dict mapping doc ID (as string) to a Document object.
            texts: list of text content extracted from the security documents.
            metadata: list of metadata dictionaries corresponding to each document.
    """
    security_docs = load_security_data()
    texts = [
        doc.get("description", "") or doc.get("descriptions", [{}])[0].get("value", "")
        for doc in security_docs
    ]
    metadata = [
        {"source": doc.get("source", "unknown"), "id": doc.get("id", f"doc_{i}")}
        for i, doc in enumerate(security_docs)
    ]
    documents = {
        str(i): Document(page_content=texts[i], metadata=metadata[i])
        for i in range(len(texts))
    }
    return documents, texts, metadata

# --- Function to Create a New FAISS Index ---

def create_faiss_index():
    """
    Create a new FAISS index from the current security data, save it to disk,
    and return the LangChain FAISS vectorstore.
    """
    # Update the CVE data before building the index.
    fetch_cve_data()

    # Build the documents, texts, and metadata from security data.
    documents, texts, metadata = build_documents()

    # Ensure we have valid texts to embed.
    if not texts or all(t.strip() == "" for t in texts):
        raise ValueError("No valid security descriptions found in dataset.")

    # Compute embeddings for the texts.
    vectors = embeddings.embed_documents(texts)
    vectors_np = np.array(vectors, dtype=np.float32)

    # Validate the embedding vectors.
    if vectors_np.size == 0:
        raise ValueError("Embedding vectors are empty. Check input data.")
    if len(vectors_np.shape) != 2:
        raise ValueError(f"Expected 2D array for FAISS, got shape {vectors_np.shape}")

    # Create and populate the FAISS index.
    index = faiss.IndexFlatL2(vectors_np.shape[1])
    index.add(vectors_np)

    # Create our custom docstore using the documents dictionary.
    docstore = SimpleDocstore(documents)

    # Create a mapping from FAISS index positions to document IDs.
    index_to_docstore_id = {i: str(i) for i in range(len(texts))}

    # Create the FAISS vectorstore wrapper.
    vectorstore = FAISS(
        embedding_function=embeddings.embed_query,
        index=index,
        docstore=docstore,
        index_to_docstore_id=index_to_docstore_id
    )

    # Ensure the directory for the index file exists.
    os.makedirs(os.path.dirname(VECTOR_DB_PATH), exist_ok=True)

    # Save the FAISS index to disk.
    faiss.write_index(index, VECTOR_DB_PATH)

    # Save the index-to-docstore mapping.
    metadata_path = f"{VECTOR_DB_PATH}_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(index_to_docstore_id, f, indent=4)

    print("FAISS Index Created & Saved!")
    return vectorstore

# --- Function to Load an Existing FAISS Index or Create a New One ---

def load_faiss_index():
    """
    Load an existing FAISS index from disk. If the index file does not exist,
    create a new index using the current security data.
    
    Returns:
        FAISS: A LangChain FAISS vectorstore.
    """
    if os.path.exists(VECTOR_DB_PATH):
        # Read the FAISS index from disk.
        index = faiss.read_index(VECTOR_DB_PATH)

        # Load the saved index-to-docstore mapping.
        metadata_path = f"{VECTOR_DB_PATH}_metadata.json"
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                index_to_docstore_id = json.load(f)
        else:
            index_to_docstore_id = {}

        # Rebuild the documents (this assumes security data hasn't changed).
        documents, _, _ = build_documents()
        docstore = SimpleDocstore(documents)

        return FAISS(
            embedding_function=embeddings.embed_query,
            index=index,
            docstore=docstore,
            index_to_docstore_id=index_to_docstore_id
        )
    else:
        # If no index exists on disk, create one.
        return create_faiss_index()