"""Add import jobs and metadata refresh tracking fields

Revision ID: 002_import_and_refresh
Revises: 001_initial_schema
Create Date: 2026-10-18 22:40:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_import_and_refresh'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add metadata tracking columns to anime_entries
    op.add_column('anime_entries', sa.Column('metadata_provider', sa.String(length=50), nullable=True))
    op.add_column('anime_entries', sa.Column('provider_media_id', sa.String(length=100), nullable=True))
    op.add_column('anime_entries', sa.Column('metadata_last_checked_at', sa.DateTime(), nullable=True))
    op.add_column('anime_entries', sa.Column('metadata_last_updated_at', sa.DateTime(), nullable=True))
    op.add_column(
        'anime_entries',
        sa.Column('metadata_sync_status', sa.String(length=30), nullable=False, server_default='CURRENT')
    )
    op.add_column(
        'anime_entries',
        sa.Column('total_episodes_source', sa.String(length=30), nullable=True, server_default='MANUAL')
    )
    op.create_index(op.f('ix_anime_entries_provider_media_id'), 'anime_entries', ['provider_media_id'], unique=False)

    # 2. Create import_jobs table
    op.create_table(
        'import_jobs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('source_type', sa.String(length=20), nullable=False, server_default='PASTE'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('total_items', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('matched_items', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('imported_items', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('skipped_items', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('failed_items', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_import_jobs_user_id'), 'import_jobs', ['user_id'], unique=False)
    op.create_index(op.f('ix_import_jobs_status'), 'import_jobs', ['status'], unique=False)
    op.create_index(op.f('ix_import_jobs_created_at'), 'import_jobs', ['created_at'], unique=False)

    # 3. Create import_job_items table
    op.create_table(
        'import_job_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('job_id', sa.String(length=36), nullable=False),
        sa.Column('raw_title', sa.String(length=255), nullable=False),
        sa.Column('parsed_status', sa.String(length=20), nullable=False, server_default='PLANNED'),
        sa.Column('parsed_watched_episodes', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('parsed_rating', sa.Integer(), nullable=True),
        sa.Column('parsed_notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('matched_title', sa.String(length=255), nullable=True),
        sa.Column('matched_alternate_title', sa.String(length=255), nullable=True),
        sa.Column('provider_media_id', sa.String(length=100), nullable=True),
        sa.Column('poster_url', sa.String(length=1000), nullable=True),
        sa.Column('total_episodes', sa.Integer(), nullable=True),
        sa.Column('match_confidence', sa.Float(), nullable=False, server_default=sa.text('0.0')),
        sa.Column('match_warning', sa.String(length=255), nullable=True),
        sa.Column('candidates_json', sa.JSON(), nullable=False),
        sa.Column('is_duplicate', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('existing_anime_id', sa.String(length=36), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['job_id'], ['import_jobs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_import_job_items_job_id'), 'import_job_items', ['job_id'], unique=False)
    op.create_index(op.f('ix_import_job_items_status'), 'import_job_items', ['status'], unique=False)


def downgrade() -> None:
    op.drop_table('import_job_items')
    op.drop_table('import_jobs')
    op.drop_index(op.f('ix_anime_entries_provider_media_id'), table_name='anime_entries')
    op.drop_column('anime_entries', 'total_episodes_source')
    op.drop_column('anime_entries', 'metadata_sync_status')
    op.drop_column('anime_entries', 'metadata_last_updated_at')
    op.drop_column('anime_entries', 'metadata_last_checked_at')
    op.drop_column('anime_entries', 'provider_media_id')
    op.drop_column('anime_entries', 'metadata_provider')
