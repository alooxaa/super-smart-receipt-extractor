import os

from .cuda_dll_path import ensure_cuda_dll_paths

ensure_cuda_dll_paths()

import cv2
import paddle
import time
from paddleocr import PaddleOCR


def _gpu_enabled() -> bool:
    if os.environ.get("PADDLE_OCR_USE_GPU", "1").lower() in ("0", "false", "no"):
        return False
    try:
        return bool(
            paddle.device.is_compiled_with_cuda()
            and paddle.device.cuda.device_count() > 0
        )
    except Exception:
        return False


_USE_GPU = _gpu_enabled()
if _USE_GPU:
    paddle.device.set_device("gpu:0")
else:
    paddle.device.set_device("cpu")

ocr_engine = PaddleOCR(use_angle_cls=True, lang="en", use_gpu=_USE_GPU)


def run_ocr(cleaned_image) -> dict:
    start = time.time()

    # Save temp image for PaddleOCR
    cv2.imwrite("temp_cleaned.jpg", cleaned_image)

    # Run OCR
    result = ocr_engine.ocr("temp_cleaned.jpg")

    # Extract text
    lines = result[0] if result and result[0] else []
    full_text = "\n".join([line[1][0] for line in lines])

    duration_ms = int((time.time() - start) * 1000)

    return {
        "full_text": full_text,
        "duration_ms": duration_ms,
    }
