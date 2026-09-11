"""tenant digest timezone + local send time

Revision ID: 0010_digest_schedule
Revises: 0009_aed_per_delay_day
Create Date: 2026-09-11
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0010_digest_schedule"
down_revision: Union[str, None] = "0009_aed_per_delay_day"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("digest_timezone", sa.String(64), nullable=False, server_default="Asia/Dubai"))
    op.add_column("tenants", sa.Column("digest_local_time", sa.String(5), nullable=False, server_default="07:00"))
    op.execute("UPDATE tenants SET digest_timezone = 'Asia/Riyadh' WHERE country = 'KSA'")


def downgrade() -> None:
    op.drop_column("tenants", "digest_local_time")
    op.drop_column("tenants", "digest_timezone")
