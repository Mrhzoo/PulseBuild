"""token ledger + assisted-ops edits

Revision ID: 0005_pilot_harden
Revises: 0004_flag_share
Create Date: 2026-09-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005_pilot_harden"
down_revision: Union[str, None] = "0004_flag_share"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "token_usage",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("usage_date", sa.Date(), nullable=False),
        sa.Column("tokens_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_unique_constraint("uq_token_usage_tenant_day", "token_usage", ["tenant_id", "usage_date"])
    op.create_table(
        "assisted_ops_edits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("kind", sa.String(40), nullable=False),
        sa.Column("entity_type", sa.String(40), server_default="finding"),
        sa.Column("entity_id", sa.String(64), nullable=False),
        sa.Column("minutes_spent", sa.Integer(), server_default="1", nullable=False),
        sa.Column("ticket", sa.String(80)),
        sa.Column("before", postgresql.JSONB()),
        sa.Column("after", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_assisted_ops_edits_tenant_id", "assisted_ops_edits", ["tenant_id"])


def downgrade() -> None:
    op.drop_table("assisted_ops_edits")
    op.drop_table("token_usage")
