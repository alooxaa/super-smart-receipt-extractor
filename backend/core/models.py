from pydantic import BaseModel
from typing import Literal, Union



class ReceiptFields(BaseModel):
    company: str | None = None
    date: str | None = None
    total: str | None = None
    address: str | None = None

class ReceiptResult(BaseModel):
    doc_id: str
    status: str
    full_text: str
    fields: ReceiptFields
    metadata: dict


class JobStatus(BaseModel):
    job_id: str
    status: Literal["processing", "done"]
    progress: float

class JobError(BaseModel):
    error: str

class JobSuccess(BaseModel):
    results: list[ReceiptResult]

JobResults = Union[JobError, JobSuccess]
