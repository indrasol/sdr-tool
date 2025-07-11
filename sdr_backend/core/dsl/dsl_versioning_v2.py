from __future__ import annotations

"""core/dsl/dsl_versioning_v2.py

Phase-4 – persistence & versioning helper.
This file provides convenience functions to add a new diagram version
into Postgres via SQLAlchemy.  For the moment we assume an external
SQLAlchemy Session is supplied by the service layer – we *do not* create
engine/SessionLocal here to keep responsibilities clear.
"""

from typing import Dict, Any, Tuple
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from models.db_schema_models_v2 import Diagram, DiagramVersion
from utils.logger import log_info


class DSLVersioningV2:
    """High-level helpers for inserting diagram + version rows."""

    # ------------------------------------------------------------------
    #  Public API
    # ------------------------------------------------------------------

    def save_new_version(
        self,
        db: Session,
        project_id: int,
        d2_dsl: str,
        rendered_json: Dict[str, Any] | None = None,
        pinned_nodes: list | None = None,
    ) -> Tuple[str, int]:
        """Persist a new *Diagram* if none exists or append a DiagramVersion.

        Returns `(diagram_id, version)` for downstream use.
        """
        pinned_nodes = pinned_nodes or []

        # Fetch or create Diagram row
        stmt = select(Diagram).where(Diagram.project_id == project_id)
        diagram = db.execute(stmt).scalar_one_or_none()
        if diagram is None:
            diagram = Diagram(
                project_id=project_id,
                d2_dsl=d2_dsl,
                rendered_json=rendered_json,
                version=1,
                pinned_nodes=pinned_nodes,
            )
            db.add(diagram)
            # Flush immediately so that the database assigns a primary key
            # to *diagram* and we can safely reference ``diagram.id`` for the
            # subsequent DiagramVersion row.  Without this explicit flush the
            # attribute stays ``None`` until the implicit flush triggered by
            # commit(), which resulted in a NOT NULL violation for
            # ``diagram_id``.
            db.flush()
            version_number = 1
            log_info(f"Created new Diagram for project {project_id}")
        else:
            # bump version
            version_number = diagram.version + 1
            diagram.d2_dsl = d2_dsl
            diagram.rendered_json = rendered_json
            diagram.version = version_number
            diagram.updated_at = datetime.utcnow()
            diagram.pinned_nodes = pinned_nodes
            log_info(
                f"Updated Diagram {diagram.id} to version {version_number} for project {project_id}"
            )

        # Insert new DiagramVersion row
        version_row = DiagramVersion(
            diagram_id=diagram.id,
            version=version_number,
            d2_dsl=d2_dsl,
            rendered_json=rendered_json,
            pinned_nodes=pinned_nodes,
        )
        db.add(version_row)
        db.commit()

        return diagram.id, version_number

    # --------------------------------------------------------------
    #  Async helper (for AsyncSession)
    # --------------------------------------------------------------

    async def save_new_version_async(
        self,
        db: AsyncSession,
        project_id: str,
        d2_dsl: str,
        rendered_json: Dict[str, Any] | None = None,
        pinned_nodes: list | None = None,
    ) -> Tuple[str, int]:
        """Async wrapper – mirrors *save_new_version* semantics."""

        pinned_nodes = pinned_nodes or []

        # Fetch diagram (async)
        stmt = select(Diagram).where(Diagram.project_id == project_id)
        result = await db.execute(stmt)
        diagram = result.scalars().first()

        if diagram is None:
            diagram = Diagram(
                project_id=project_id,
                d2_dsl=d2_dsl,
                rendered_json=rendered_json,
                version=1,
                pinned_nodes=pinned_nodes,
            )
            db.add(diagram)
            # Ensure the INSERT runs so ``diagram.id`` is populated before
            # we create the dependent ``DiagramVersion`` row.
            await db.flush()
            version_number = 1
            log_info(f"[async] Created Diagram for project {project_id}")
        else:
            version_number = diagram.version + 1
            diagram.d2_dsl = d2_dsl
            diagram.rendered_json = rendered_json
            diagram.version = version_number
            diagram.updated_at = datetime.utcnow()
            diagram.pinned_nodes = pinned_nodes
            log_info(f"[async] Updated Diagram {diagram.id} -> v{version_number}")

        # Add history row
        version_row = DiagramVersion(
            diagram_id=diagram.id,
            version=version_number,
            d2_dsl=d2_dsl,
            rendered_json=rendered_json,
            pinned_nodes=pinned_nodes,
        )
        db.add(version_row)

        # Flush before commit so foreign-key constraints are satisfied even
        # when the ORM decides to emit INSERTs in batch mode.
        await db.flush()

        await db.commit()

        return diagram.id, version_number

    # ------------------------------------------------------------------
    #  Fetch helpers
    # ------------------------------------------------------------------

    async def fetch_latest_dsl_async(self, db: AsyncSession, project_id: str) -> str | None:
        """Return the D2 DSL text of the latest diagram version for a project."""
        from models.db_schema_models_v2 import Diagram, DiagramVersion

        stmt = (
            select(DiagramVersion.d2_dsl)
            .join(Diagram, Diagram.id == DiagramVersion.diagram_id)
            .where(Diagram.project_id == project_id)
            .order_by(DiagramVersion.version.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        row = result.scalar_one_or_none()
        return row  # may be None if no diagram yet 