from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy import Date
from constants import ProjectPriority, ProjectStatus

# Base class for declarative models
Base = declarative_base()

# Junction table for many-to-many relationship between User and Tenant
class UserTenantAssociation(Base):
    __tablename__ = "user_tenant_association"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    projects = relationship("Project", back_populates="user")
    tenants = relationship("Tenant", secondary="user_tenant_association", back_populates="users")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.NOT_STARTED, nullable=False)
    priority = Column(Enum(ProjectPriority), nullable=True)
    created_date = Column(Date, server_default=func.current_date(), nullable=False)  # Default to current date
    due_date = Column(Date, nullable=True)  
    creator = Column(String, nullable=False)  
    assigned_to = Column(String, nullable=True)  
    domain = Column(String, nullable=True)  
    template_type = Column(String, nullable=True)  
    imported_file = Column(String, nullable=True)  
    user = relationship("User", back_populates="projects")
    conversation_history = Column(ARRAY(JSONB), default=[])
    diagram_state = Column(JSONB, default={"nodes": [], "edges": []})
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    tenant = relationship("Tenant", back_populates="projects")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        """Convert project to a dictionary for JSON response."""
        return {
            "id": self.project_code,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
            "priority": self.priority.value if self.priority else None, 
            "created_date": self.created_date.isoformat() if self.created_date else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "creator": self.creator,
            "assigned_to": self.assigned_to,
            "domain": self.domain,
            "template_type": self.template_type,
            "imported_file": self.imported_file,
            "tenant_id": self.tenant_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "conversation_history": self.conversation_history,
            "diagram_state": self.diagram_state
        }
class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)  
    users = relationship("User", secondary="user_tenant_association", back_populates="tenants")
    projects = relationship("Project", back_populates="tenant")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    role_name = Column(String)  # e.g., "admin", "editor"