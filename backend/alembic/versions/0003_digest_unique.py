"""one digest per tenant per day

Revision ID: 0003_digest_unique
Revises: 0002_project_code
Create Date: 2026-09-07
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0003_digest_unique"
down_revision: Union[str, None] = "0002_project_code"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint("uq_digests_tenant_date", "digests", ["tenant_id", "digest_date"])


def downgrade() -> None:
    op.drop_constraint("uq_digests_tenant_date", "digests", type_="unique")
