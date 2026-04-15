from fastapi.testclient import TestClient
from backend.main import app
from time import time

client = TestClient(app)

base_path = "/home/yujiqo/.cache/kagglehub/datasets/urbikn/sroie-datasetv2/versions/4/SROIE2019/test/img"

with open(f"{base_path}/X00016469670.jpg", "rb") as f1, \
     open(f"{base_path}/X00016469671.jpg", "rb") as f2:

    response = client.post(
        "/scan_receipts_async",
        files=[("files", f1), ("files", f2)]
    )

job_id = response.json()["job_id"]

while True:
    status = client.get(f"/jobs/{job_id}").json()
    print(status)

    if status["status"] == "done":
        break

    time.sleep(0.1)

result = client.get(f"/jobs/{job_id}/results").json()

print(result)
