"""Add performance composite indexes for user-scoped queries

Revision ID: 003_perf_indexes
Revises: 002_import_and_refresh
Create Date: 2026-10-18 23:45:00

"""
from typing import Sequence, Union
from alembic import op

revision: str = '003_perf_indexes'
down_revision: Union[str, None] = '002_import_and_refresh'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Composite indexes to accelerate authenticated user collection queries and status filtering
    op.create_index(
        'ix_anime_user_updated',
        'anime_entries',
        ['user_id', 'updated_at'],
        unique=False
    )
    op.create_index(
        'ix_anime_user_status',
        'anime_entries',
        ['user_id', 'status'],
        unique=False
    )
    op.create_index(
        'ix_anime_user_favorite',
        'anime_entries',
        ['user_id', 'is_favorite'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index('ix_anime_user_favorite', table_name='anime_entries')
    op.drop_index('ix_anime_user_status', table_name='anime_entries')
    op.drop_index('ix_anime_user_updated', table_name='anime_entries')
