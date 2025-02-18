# Response model
from pydantic import BaseModel


class ArchitectureResponse(BaseModel):
    status: str
    architecture: dict