"""flag dismiss + revoke columns and one active flag per finding

Revision ID: 0004_flag_share
Revises: 0003_digest_unique
Create Date: 2026-09-07
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_flag_share"
down_revision: Union[str, None] = "0003_digest_unique"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("flags", sa.Column("dismissed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("flags", sa.Column("share_revoked_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_flags_finding_id", "flags", ["finding_id"])
    op.create_index("uq_flags_active_tenant_finding", "flags", ["tenant_id", "finding_id"], unique=True, postgresql_where=sa.text("dismissed_at IS NULL"))


def downgrade() -> None:
    op.drop_index("uq_flags_active_tenant_finding", table_name="flags")
    op.drop_index("ix_flags_finding_id", table_name="flags")
    op.drop_column("flags", "share_revoked_at")
    op.drop_column("flags", "dismissed_at")
