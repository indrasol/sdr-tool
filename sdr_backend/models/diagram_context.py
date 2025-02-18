
from pydantic import BaseModel
from typing import List
from models.nodes import Node
from models.edges import Edge

class DiagramContext(BaseModel):
    nodes: List[Node] = []
    edges: List[Edge] = []

