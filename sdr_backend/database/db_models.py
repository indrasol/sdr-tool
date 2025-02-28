from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database.data_base import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="None")
    user = Column(String, nullable=False, default="Current User")
    modified = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    created = Column(DateTime, nullable=False, default=func.now())
    priority = Column(String, nullable=False, default="0-None")
    model_type = Column(String, nullable=False, default="Model With AI")
    description = Column(Text, nullable=True)
    project_number = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    version = Column(String, nullable=True, default="1.0")