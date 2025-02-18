
from typing import Any, Dict
from pydantic import BaseModel

class Edge(BaseModel):
    id: str
    source: str
    target: str
    # animated: bool = False
    # label: str = ""
    # style: Dict[str, Any] = {}
    # data: Dict[str, Any] = {}
    # animated: bool = False
    # label: str = ""