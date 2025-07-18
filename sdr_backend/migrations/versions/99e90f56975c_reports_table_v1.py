"""Reports table v1

Revision ID: 99e90f56975c
Revises: ff4752715db9
Create Date: 2025-06-22 20:57:45.257447

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '99e90f56975c'
down_revision: Union[str, None] = 'ff4752715db9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('reports',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('report_id', sa.String(length=36), nullable=False),
    sa.Column('project_code', sa.String(), nullable=False),
    sa.Column('generated_by', sa.String(), nullable=False),
    sa.Column('content', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('diagram_url', sa.String(), nullable=True),
    sa.Column('high_risks', sa.Integer(), nullable=True),
    sa.Column('medium_risks', sa.Integer(), nullable=True),
    sa.Column('low_risks', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['generated_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['project_code'], ['projects.project_code'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('report_id')
    )
    op.create_index(op.f('ix_reports_id'), 'reports', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('templates', 'template_visibility',
               existing_type=postgresql.ARRAY(sa.String()),
               type_=postgresql.ARRAY(sa.TEXT()),
               existing_nullable=False)
    op.alter_column('templates', 'template_tags',
               existing_type=postgresql.ARRAY(sa.String()),
               type_=postgresql.ARRAY(sa.TEXT()),
               existing_nullable=False)
    op.alter_column('templates', 'template_name',
               existing_type=sa.String(),
               type_=sa.TEXT(),
               existing_nullable=False)
    op.alter_column('templates', 'tenant_name',
               existing_type=sa.String(),
               type_=sa.TEXT(),
               existing_nullable=False)
    op.alter_column('templates', 'template_id',
               existing_type=sa.String(length=4),
               type_=sa.TEXT(),
               existing_nullable=False)
    op.drop_index(op.f('ix_reports_id'), table_name='reports')
    op.drop_table('reports')
    # ### end Alembic commands ###
