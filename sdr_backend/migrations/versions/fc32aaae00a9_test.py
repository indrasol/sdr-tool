"""test

Revision ID: fc32aaae00a9
Revises: 52af4b1d1ecf
Create Date: 2025-03-08 01:37:09.699643

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc32aaae00a9'
down_revision: Union[str, None] = '52af4b1d1ecf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
