"""billing + onboarding columns

Revision ID: 0007_repeatable
Revises: 0006_v15
Create Date: 2026-09-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007_repeatable"
down_revision: Union[str, None] = "0006_v15"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("stripe_customer_id", sa.String(64), nullable=True))
    op.add_column("tenants", sa.Column("stripe_subscription_id", sa.String(64), nullable=True))
    op.add_column("tenants", sa.Column("project_quota", sa.Integer(), server_default="3", nullable=False))
    op.add_column("tenants", sa.Column("billing_status", sa.String(20), server_default="trialing", nullable=False))
    op.add_column("tenants", sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("tenants", "onboarding_completed_at")
    op.drop_column("tenants", "billing_status")
    op.drop_column("tenants", "project_quota")
    op.drop_column("tenants", "stripe_subscription_id")
    op.drop_column("tenants", "stripe_customer_id")
