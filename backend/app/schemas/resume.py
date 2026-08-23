from pydantic import BaseModel
from typing import Optional

class ResumeBase(BaseModel):
    file_path: Optional[str] = None
    parsed_text: Optional[str] = None

class ResumeCreate(ResumeBase):
    candidate_id: int

class Resume(ResumeBase):
    id: int
    candidate_id: int
    class Config:
        from_attributes = True
