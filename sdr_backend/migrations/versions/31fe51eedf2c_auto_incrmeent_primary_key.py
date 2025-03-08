"""auto incrmeent primary key

Revision ID: 31fe51eedf2c
Revises: d755eeaa8f7e
Create Date: 2025-03-08 01:18:54.827888

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '31fe51eedf2c'
down_revision: Union[str, None] = 'd755eeaa8f7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
