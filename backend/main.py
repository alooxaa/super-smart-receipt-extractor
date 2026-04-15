import uuid
from fastapi import FastAPI, File, BackgroundTasks
from typing import Annotated
from cv_pipeline.pipeline import process_receipt
from backend.core.models import ReceiptResult, JobStatus, JobResults



app = FastAPI()

jobs = {}
results = {}

app = FastAPI()


@app.post("/scan_receipts", response_model=list[ReceiptResult])
async def scan_receipts(files: Annotated[list[bytes], File()]):
    results = []

    for file in files:
        doc_id = str(uuid.uuid4())

        result = process_receipt(image_bytes=file)

        results.append({
            "doc_id": doc_id,
            "status": "ok",
            "full_text": result["full_text"],
            "fields": result["fields"],
            "metadata": {
                "method": result["method"],
                "duration_ms": result["duration_ms"]
            }
        })

    return results

def process_job(job_id: str, files: list[bytes]):
    job_results = []
    total = len(files)

    for i, file in enumerate(files):
        doc_id = str(uuid.uuid4())

        result = process_receipt(image_bytes=file)

        job_results.append({
            "doc_id": doc_id,
            "status": "ok",
            "full_text": result["full_text"],
            "fields": result["fields"],
            "metadata": {
                "method": result["method"],
                "duration_ms": result["duration_ms"]
            }
        })

        jobs[job_id]["progress"] = (i + 1) / total

    results[job_id] = {"results": job_results}
    jobs[job_id]["status"] = "done"

@app.post("/scan_receipts_async", response_model=JobStatus)
async def scan_receipts_async(
    background_tasks: BackgroundTasks,
    files: Annotated[list[bytes], File()]
):
    job_id = str(uuid.uuid4())
    files_copy = [file for file in files]

    job = {
        "job_id": job_id,
        "status": "processing",
        "progress": 0.0
    }

    jobs[job_id] = job

    background_tasks.add_task(process_job, job_id, files_copy)

    return job

@app.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    return jobs[job_id]

@app.get("/jobs/{job_id}/results", response_model=JobResults)
async def get_job_results(job_id: str):
    if jobs[job_id]["status"] != "done":
        return {"error": "Job not finished"}

    return results[job_id]
