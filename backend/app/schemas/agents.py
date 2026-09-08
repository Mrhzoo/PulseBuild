"""Pydantic contracts for the v1 agent graph."""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Evidence(BaseModel):
    snippet: str
    pointer: str = Field(..., description="document_id#page=N or message timestamp")
    source_date: date | None = None


class AgentFinding(BaseModel):
    agent: Literal["schedule", "cashflow", "change_order", "compliance"]
    proposed_severity: Literal["act", "watch", "low"]
    title: str
    why_it_hits_us: str
    evidence: Evidence
    confidence: float = Field(ge=0, le=1)
    rationale: str = ""
    amount: float | None = None
    amount_currency: str | None = None
    related_date: date | None = None

    @model_validator(mode="after")
    def numbers_need_evidence(self) -> "AgentFinding":
        if self.proposed_severity == "act" and not self.evidence.pointer.strip():
            raise ValueError("Act findings require evidence.pointer")
        if self.amount is not None and not self.evidence.pointer.strip():
            raise ValueError("amount requires evidence.pointer")
        if self.related_date is not None and not self.evidence.pointer.strip():
            raise ValueError("date requires evidence.pointer")
        return self


class OrchestratorCard(BaseModel):
    severity: Literal["act", "watch", "low"]
    title: str
    why_it_hits_us: str
    evidence: Evidence
    confidence: float = Field(ge=0, le=1)
    source_agents: list[str]
    rationale: str = ""

    @model_validator(mode="after")
    def act_requires_evidence(self) -> "OrchestratorCard":
        if self.severity == "act" and not self.evidence.pointer.strip():
            raise ValueError("Act cards cannot ship without evidence_pointer")
        return self


class ProjectSnapshot(BaseModel):
    project_id: str
    project_name: str
    tenant_role: str
    currency: str
    events: list[dict] = Field(default_factory=list)
    document_excerpts: list[dict] = Field(default_factory=list)


class AgentGraphResult(BaseModel):
    cards: list[OrchestratorCard]
    dropped: list[str] = Field(default_factory=list)
