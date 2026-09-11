"""tenant aed_per_delay_day for exposure strip

Revision ID: 0009_aed_per_delay_day
Revises: 0008_share_packs
Create Date: 2026-09-11
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0009_aed_per_delay_day"
down_revision: Union[str, None] = "0008_share_packs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("aed_per_delay_day", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("tenants", "aed_per_delay_day")
