"""remove not null constraint on asseigned_to

Revision ID: 0992a800f27e
Revises: 40ca7271f194
Create Date: 2025-03-09 21:51:44.423613

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0992a800f27e'
down_revision: Union[str, None] = '40ca7271f194'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('projects', 'assigned_to',
               existing_type=sa.VARCHAR(),
               nullable=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('projects', 'assigned_to',
               existing_type=sa.VARCHAR(),
               nullable=False)
    # ### end Alembic commands ###
