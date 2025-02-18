from typing import Any, Dict
from pydantic import BaseModel

class Node(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]