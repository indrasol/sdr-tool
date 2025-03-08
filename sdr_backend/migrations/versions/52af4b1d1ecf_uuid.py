"""UUID

Revision ID: 52af4b1d1ecf
Revises: 31fe51eedf2c
Create Date: 2025-03-08 01:26:16.127877

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '52af4b1d1ecf'
down_revision: Union[str, None] = '31fe51eedf2c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
     op.alter_column('users', 'id',
               existing_type=postgresql.STRING(),
               type_=sa.UUID(),
               existing_nullable=True,
               existing_server_default=sa.text('now()'))
     op.alter_column('user_tenant_association', 'id',
               existing_type=postgresql.INTEGER(),
               type_=sa.UUID(),
               existing_nullable=True,
               existing_server_default=sa.text('now()'))
     op.alter_column('projects', 'id',
            existing_type=postgresql.INTEGER(),
            type_=sa.UUID(),
            existing_nullable=True,
            existing_server_default=sa.text('now()'))
     op.alter_column('tenants', 'id',
            existing_type=postgresql.INTEGER(),
            type_=sa.UUID(),
            existing_nullable=True)
     pass


def downgrade() -> None:
    pass
