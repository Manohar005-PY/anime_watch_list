"""Initial schema for users, sessions, password_resets, and anime_entries

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-18 21:40:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('display_name', sa.String(length=100), nullable=True),
        sa.Column('preferences', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. sessions table
    op.create_table(
        'sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('session_token_hash', sa.String(length=64), nullable=False),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_accessed_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_token_hash')
    )
    op.create_index(op.f('ix_sessions_user_id'), 'sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_sessions_session_token_hash'), 'sessions', ['session_token_hash'], unique=True)

    # 3. password_resets table
    op.create_table(
        'password_resets',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token_hash')
    )
    op.create_index(op.f('ix_password_resets_user_id'), 'password_resets', ['user_id'], unique=False)
    op.create_index(op.f('ix_password_resets_token_hash'), 'password_resets', ['token_hash'], unique=True)

    # 4. anime_entries table
    op.create_table(
        'anime_entries',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('normalized_title', sa.String(length=255), nullable=False),
        sa.Column('alternate_title', sa.String(length=255), nullable=True),
        sa.Column('poster_url', sa.String(length=1000), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('total_episodes', sa.Integer(), nullable=True),
        sa.Column('watched_episodes', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_favorite', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('genres', sa.JSON(), nullable=False),
        sa.Column('started_at', sa.Date(), nullable=True),
        sa.Column('completed_at', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint('watched_episodes >= 0', name='chk_watched_episodes_positive'),
        sa.CheckConstraint('rating IS NULL OR (rating >= 1 AND rating <= 10)', name='chk_rating_range'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'normalized_title', name='uq_user_normalized_title')
    )
    op.create_index(op.f('ix_anime_entries_user_id'), 'anime_entries', ['user_id'], unique=False)
    op.create_index(op.f('ix_anime_entries_normalized_title'), 'anime_entries', ['normalized_title'], unique=False)
    op.create_index(op.f('ix_anime_entries_status'), 'anime_entries', ['status'], unique=False)
    op.create_index(op.f('ix_anime_entries_is_favorite'), 'anime_entries', ['is_favorite'], unique=False)
    op.create_index(op.f('ix_anime_entries_created_at'), 'anime_entries', ['created_at'], unique=False)
    op.create_index(op.f('ix_anime_entries_updated_at'), 'anime_entries', ['updated_at'], unique=False)


def downgrade() -> None:
    op.drop_table('anime_entries')
    op.drop_table('password_resets')
    op.drop_table('sessions')
    op.drop_table('users')
