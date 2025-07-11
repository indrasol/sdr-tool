from __future__ import annotations

"""models/db_schema_models_v2.py

Database schema for Design-Service 2.0 diagram storage.

This module introduces a dedicated *diagrams* table that stores the
latest revision for every project as well as an append-only
*diagram_versions* history table that keeps all previous revisions for
auditing and rollback purposes.

"""
import os
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone
from sqlalchemy import Enum as SQLAlchemyEnum
from constants import ProjectPriority, ProjectStatus
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, ARRAY, JSON, Float, Date, Boolean
from sqlalchemy import func  # Added to use SQLAlchemy SQL functions like now()

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    ARRAY,
)
from sqlalchemy import JSON as _GENERIC_JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Provide cross-dialect JSONB alias – falls back to generic JSON when PostgreSQL dialect not available
try:
    from sqlalchemy.dialects.postgresql import JSONB as _PG_JSONB  # type: ignore
    JSONB = _PG_JSONB  # noqa: N816 keep upper-case alias for existing models
except ImportError:  # e.g. SQLite during local dev
    JSONB = _GENERIC_JSON  # type: ignore

class Diagram(Base):
    """Current head revision of a diagram for a project."""

    __tablename__ = "diagrams"

    id = Column(Integer, primary_key=True, index=True)

    # User-facing key – project_code such as "P1234". We do **not**
    # cascade deletes because the project table may live in a separate
    # DB/schema; application layer takes care of cleaning up.
    project_id = Column(String, index=True, nullable=False)

    # Canonical DSL source (D2 text)
    d2_dsl = Column(Text, nullable=False)

    # Rendered React-Flow JSON returned to the front-end (nodes/edges)
    rendered_json = Column(JSONB, nullable=False)

    # Monotonically increasing version counter (mirrors
    # DiagramVersion.version from latest row).
    version = Column(Integer, nullable=False, default=1)

    # IDs of nodes the user pinned (persisted across auto-layout passes)
    pinned_nodes = Column(ARRAY(String), default=[])

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationship – back-ref convenience, not used by the service yet.
    versions = relationship(
        "DiagramVersion", back_populates="diagram", cascade="all, delete-orphan"
    )

    # ------------------------------------------------------------------
    #  Helpers
    # ------------------------------------------------------------------

    def __repr__(self):
        return f"<Diagram id={self.id} project_id={self.project_id} v{self.version}>"


class DiagramVersion(Base):
    """Immutable history row for every diagram revision."""

    __tablename__ = "diagram_versions"

    id = Column(Integer, primary_key=True, index=True)
    diagram_id = Column(Integer, ForeignKey("diagrams.id", ondelete="CASCADE"), nullable=False)

    # Sequential per-diagram version number starting at 1
    version = Column(Integer, nullable=False)

    d2_dsl = Column(Text, nullable=False)
    rendered_json = Column(JSONB, nullable=False)
    pinned_nodes = Column(ARRAY(String), default=[])

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to head diagram
    diagram = relationship("Diagram", back_populates="versions")

    # ------------------------------------------------------------------
    #  Helpers
    # ------------------------------------------------------------------

    def __repr__(self):
        return (
            f"<DiagramVersion id={self.id} diagram_id={self.diagram_id} v{self.version}>"
        )

# ---------------------------------------------------------------------------
#  Re-export legacy tables so that v2 modules can import from this file only
# ---------------------------------------------------------------------------


# Junction table for many-to-many relationship between User and Tenant
class UserTenantAssociation(Base):
    __tablename__ = "user_tenant_association"
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    projects = relationship("Project", back_populates="user")
    roles = relationship("Role", back_populates="user")
    tenants = relationship("Tenant", secondary="user_tenant_association", back_populates="users")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    roles = relationship("Role", back_populates="project")
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(SQLAlchemyEnum(ProjectStatus), default=ProjectStatus.NOT_STARTED, nullable=False)
    priority = Column(SQLAlchemyEnum(ProjectPriority), nullable=True)
    created_date = Column(Date, server_default=func.current_date(), nullable=False)  # Default to current date
    due_date = Column(Date, nullable=True)  
    creator = Column(String, nullable=False)  
    assigned_to = Column(String, nullable=True)  
    threat_model_id = Column(String, nullable=True, index=True)
    dfd_data = Column(ARRAY(JSONB), default=[])
    domain = Column(String, nullable=True)  
    template_type = Column(String, nullable=True)  
    imported_file = Column(String, nullable=True)  
    user = relationship("User", back_populates="projects")
    conversation_history = Column(ARRAY(JSONB), default=[])
    diagram_state = Column(JSONB, default={"nodes": [], "edges": []})
    version = Column(Integer, default=0, nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    tenant = relationship("Tenant", back_populates="projects")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    diagram_updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

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
            "diagram_state": self.diagram_state,
            "version": self.version,
            "threat_model_id" : self.threat_model_id,
            "dfd_data" : self.dfd_model,
            "diagram_updated_at" : self.diagram_updated_at
        }
class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)  
    users = relationship("User", secondary="user_tenant_association", back_populates="tenants")
    projects = relationship("Project", back_populates="tenant")
    templates = relationship("Template", back_populates="tenant")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    roles = relationship("Role", back_populates="tenant")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    project_code = Column(String, ForeignKey("projects.project_code"), nullable=False)
    role_name = Column(String)  # e.g., "admin", "editor"
    permissions = Column(JSONB, default={"view": True, "edit": False})  # JSONB for permissions
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="roles")
    tenant = relationship("Tenant", back_populates="roles")
    project = relationship("Project", back_populates="roles")

class Session(Base):
    """SQLAlchemy model for sessions table.
    
    Maps to the sessions table in the database. This table tracks active sessions
    for users and projects, allowing session resumption beyond Redis TTL expiry.
    """
    __tablename__ = 'sessions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, nullable=False, unique=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    project_id = Column(String, nullable=False, index=True)
    version = Column(Integer, default=0, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_accessed = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, nullable=False, default=True)
    
    def __repr__(self):
        return f"<Session(session_id='{self.session_id}', user_id='{self.user_id}', project_id='{self.project_id}')>"

class Sessions(BaseModel):
    """
    Sessions table model - Tracks active sessions for users and projects.
    This provides persistence for session IDs beyond Redis TTL expiry.
    
    The actual session content is stored in Redis, while this table
    stores metadata about sessions to allow users to resume their work.
    """
    id: Optional[int] = Field(None, description="Auto-increment primary key")
    session_id: str = Field(..., description="Unique session identifier (UUID)")
    user_id: str = Field(..., description="User ID associated with the session")
    project_id: str = Field(..., description="Project ID associated with the session")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Session creation timestamp")
    last_accessed: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Last time the session was accessed")
    is_active: bool = Field(default=True, description="Whether the session is still active")
    
    model_config = ConfigDict(
        from_attributes=True,         # was orm_mode
        json_schema_extra={           # was schema_extra
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "user123",
                "project_id": "project456",
                "created_at": "2023-09-01T12:00:00Z",
                "last_accessed": "2023-09-01T14:30:00Z",
                "is_active": True
            }
        }
    )

class Template(Base):
    __tablename__ = "templates"

    # internal PK
    id = Column(Integer, primary_key=True, index=True)

    # user‐facing 5-char ID ("T" + 4 digits)
    template_id = Column(String(5), unique=True, nullable=False, index=True)

    # who created it
    tenant_id   = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    tenant_name = Column(String, nullable=False)

    # the actual diagram JSON + metadata
    diagram_state = Column(JSONB, nullable=False)
    template_name       = Column(String, nullable=False)
    template_description= Column(Text, nullable=True)

    # tags & visibility flags
    template_tags       = Column(ARRAY(String), server_default="{}", nullable=False)
    template_visibility = Column(ARRAY(String), server_default="{}", nullable=False)

    # timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # relationship back to Tenant
    tenant = relationship("Tenant", back_populates="templates")


class Report(Base):
    __tablename__ = "reports"

    id            = Column(Integer, primary_key=True, index=True)
    report_id     = Column(String(36), unique=True, nullable=False)          # UUID
    project_code  = Column(String, ForeignKey("projects.project_code"), nullable=False)
    generated_by  = Column(String, ForeignKey("users.id"), nullable=False)
    # store the fully rendered JSON blob so a regenerate is fast
    content       = Column(JSONB, nullable=False)
    # link to PNG/JPEG for the architecture snapshot
    diagram_url   = Column(String, nullable=True)
    diagram_hash   = Column(String, nullable=True)
    # shallow denormalised stats for listing
    high_risks    = Column(Integer, default=0)
    medium_risks  = Column(Integer, default=0)
    low_risks     = Column(Integer, default=0)

    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(),
                           onupdate=func.now())

    project = relationship("Project")
    user    = relationship("User")


# ---------------------------------------------------------------------------
#  Fine-grained tables added for Phase-9/10 analytics & RBAC
# ---------------------------------------------------------------------------

# 1. Notification & audit log ------------------------------------------------


class Notification(Base):
    """User-visible toast / audit event."""

    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    project_id = Column(String, nullable=True, index=True)
    # enum-ish text, e.g. DIAGRAM_UPDATED, THREAT_HIGH, COMMENT, …
    type = Column(String, nullable=False)
    payload_json = Column(JSONB, nullable=False, default={})
    is_read = Column(Integer, nullable=False, default=0)  # 0 = unread, 1 = read
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# 2. Persistent threat items --------------------------------------------------


class Threat(Base):
    """One STRIDE / risk item produced by threat analysis."""

    __tablename__ = "threats"

    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String, nullable=False, index=True)
    diagram_version = Column(Integer, nullable=False)
    node_id = Column(String, nullable=True)  # may be null for global threats
    stride_category = Column(String, nullable=False)  # S, T, R, I, D, E
    severity = Column(String, nullable=False)  # HIGH / MEDIUM / LOW
    description = Column(Text, nullable=False)
    mitigation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# 3. Diagram catalogue --------------------------------------------------------


class DiagramNode(Base):
    __tablename__ = "diagram_nodes"

    id = Column(Integer, primary_key=True, index=True)
    diagram_id = Column(Integer, ForeignKey("diagrams.id", ondelete="CASCADE"), nullable=False)
    node_uid = Column(String, nullable=False)  # unique within one diagram
    type = Column(String, nullable=False)
    label = Column(String, nullable=False)
    layer = Column(String, nullable=True)
    trust_zone = Column(String, nullable=True)


class DiagramEdge(Base):
    __tablename__ = "diagram_edges"

    id = Column(Integer, primary_key=True, index=True)
    diagram_id = Column(Integer, ForeignKey("diagrams.id", ondelete="CASCADE"), nullable=False)
    edge_uid = Column(String, nullable=False)
    source_uid = Column(String, nullable=False)
    target_uid = Column(String, nullable=False)


# 4. Organisation & membership ----------------------------------------------


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    owner_user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    members = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")


class OrganizationMember(Base):
    __tablename__ = "organization_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False, default="member")  # e.g. owner, admin, viewer
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="members") 