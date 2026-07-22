"""add is_verified to users

Revision ID: a616412fea1f
Revises: f4d3e69cde4c
Create Date: 2026-07-21 23:12:37.661622

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a616412fea1f'
down_revision: Union[str, Sequence[str], None] = 'f4d3e69cde4c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'users',
        sa.Column(
            'is_verified',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('false')
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'is_verified')