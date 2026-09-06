"""unique project code per tenant

Revision ID: 0002_project_code
Revises: 0001_init
Create Date: 2026-09-06
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0002_project_code"
down_revision: Union[str, None] = "0001_init"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DELETE FROM projects p
        WHERE EXISTS (
            SELECT 1 FROM projects keep
            WHERE keep.tenant_id = p.tenant_id
              AND keep.code = p.code
              AND keep.id < p.id
        )
        AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.project_id = p.id)
        AND NOT EXISTS (SELECT 1 FROM events e WHERE e.project_id = p.id)
        AND NOT EXISTS (SELECT 1 FROM findings f WHERE f.project_id = p.id)
        """
    )
    op.create_unique_constraint("uq_projects_tenant_code", "projects", ["tenant_id", "code"])


def downgrade() -> None:
    op.drop_constraint("uq_projects_tenant_code", "projects", type_="unique")
