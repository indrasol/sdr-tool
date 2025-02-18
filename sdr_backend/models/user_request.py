
from pydantic import BaseModel
from models.diagram_context import DiagramContext

class UserRequest(BaseModel):
    user_input: str
    diagram_context: DiagramContext