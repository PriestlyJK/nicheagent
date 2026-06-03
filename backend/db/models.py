from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional
from datetime import datetime
import uuid

class NicheOut(BaseModel):
    id: uuid.UUID
    name: str
    category: Optional[str] = None
    why_summary: Optional[str] = None
    signal_score: Optional[int] = None
    fit_score: Optional[int] = None
    mvp_weeks: Optional[int] = None
    competition: Optional[str] = None
    tags: list[str] = []
    created_at: datetime

    @field_validator("tags", mode="before")
    @classmethod
    def fix_tags(cls, v):
        if v is None:
            return []
        return v

class SignalOut(BaseModel):
    id: uuid.UUID
    source: str
    source_url: Optional[str]
    title: Optional[str]
    content: Optional[str]
    metadata: Optional[dict]
    niche_id: Optional[uuid.UUID]
    created_at: datetime

class CompetitorOut(BaseModel):
    id: uuid.UUID
    niche_id: uuid.UUID
    name: str
    website: Optional[str]
    arr_estimate: Optional[str]
    funding: Optional[str]
    gaps: list[str] = []
    strengths: list[str] = []
    ph_url: Optional[str]
    li_url: Optional[str]

class ScanOut(BaseModel):
    id: uuid.UUID
    status: str
    sources_done: list[str] = []
    niches_found: int = 0
    signals_found: int = 0
    triggered_by: str = "manual"
    started_at: datetime
    finished_at: Optional[datetime] = None

    @field_validator("sources_done", mode="before")
    @classmethod
    def fix_sources_done(cls, v):
        if v is None:
            return []
        return v

class ReactionIn(BaseModel):
    niche_id: uuid.UUID
    reaction: str   # 'real' | 'not_real' | 'interested'
    comment: Optional[str] = None

class ProfileIn(BaseModel):
    username: Optional[str] = None
    expertise: Optional[list[str]] = None
    budget_range: Optional[str] = None
    looking_for: Optional[list[str]] = None
    bio: Optional[str] = None

class CommunityNicheIn(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
