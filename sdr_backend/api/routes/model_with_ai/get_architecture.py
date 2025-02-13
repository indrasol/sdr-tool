from fastapi import FastAPI, HTTPException


app = FastAPI()

# In-memory storage for now (Replace with DB later)
architecture_models = {}

@app.get("/get_architecture/{session_id}")
async def get_architecture(session_id: str):
    if session_id not in architecture_models:
        raise HTTPException(status_code=404, detail="Session not found")
    return architecture_models[session_id]