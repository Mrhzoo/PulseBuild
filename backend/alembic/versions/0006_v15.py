"""whatsapp e164 + portal connections

Revision ID: 0006_v15
Revises: 0005_pilot_harden
Create Date: 2026-09-08
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006_v15"
down_revision: Union[str, None] = "0005_pilot_harden"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("whatsapp_e164", sa.String(length=20), nullable=True))
    op.create_table(
        "portal_connections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("connector_type", sa.String(40), server_default="generic_https"),
        sa.Column("base_url", sa.String(400), server_default=""),
        sa.Column("last_sync_at", sa.DateTime(timezone=True)),
        sa.Column("last_status", sa.String(20), server_default="never"),
        sa.Column("last_error", sa.Text()),
        sa.Column("docs_pulled", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_portal_connections_tenant_id", "portal_connections", ["tenant_id"], unique=True)


def downgrade() -> None:
    op.drop_table("portal_connections")
    op.drop_column("users", "whatsapp_e164")
