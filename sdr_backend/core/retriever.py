from .embeddings import load_faiss_index

# Load FAISS index
vector_store = load_faiss_index()

# Retrieve relevant documents based on input security architecture
def retrieve_relevant_docs(query: str, top_k: int = 3):
    print("------------------")
    print("Inside retrieve_relevant_docs")
    print("------------------")
    # Log the number of vectors in the FAISS index
    num_vectors = vector_store.index.ntotal  # Correct way to check the number of vectors
    print(f"FAISS index contains {num_vectors} vectors.")  # Check the number of vectors in the index
    print("------------------")
    print(f"Searching for query: {query}")  # Log the query being searched
    print("------------------")
    # # Assuming you load the index like this:
    # if not vector_store:
    #     print("Vector store is empty or not initialized.")  # Check vector store
    # else:
    #     print(f"Loaded vector store with {len(vector_store.index)} vectors.") 

    if num_vectors == 0:
        print("FAISS index is empty.")
        return []
    
    # Query preprocessing (optional)
    query = query.strip().lower()  # Make sure the query is cleaned and standardized

    try:
        print("------------------")
        results = vector_store.similarity_search_with_score(query, k=top_k)
    except Exception as e:
        print(f"Error during FAISS search: {e}")  # Log any exceptions during the search
        return []
    if not results:
        print("------------------")
        print("No results found in vector store")  # Log when no results are returned
    
    # Log each result for debugging
    for res in results:
        print(f"Result: {res[0].page_content}, Score: {res[1]}")

    print(f"Search results: {results}")  # Log the raw results for debugging
    return [
        {"text": res[0].page_content, "metadata": res[0].metadata, "score": res[1]} 
        for res in results
    ]
