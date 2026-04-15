import os

from .cuda_dll_path import ensure_cuda_dll_paths

ensure_cuda_dll_paths()

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


def _env_bool(key: str, default: str) -> bool:
    return os.environ.get(key, default).lower() in ("1", "true", "yes")


def _env_float(key: str, default: float) -> float:
    try:
        return float(os.environ[key])
    except (KeyError, ValueError):
        return default


_USE_GPU = _gpu_enabled()
print("Device: ", end="")
if _USE_GPU:
    paddle.device.set_device("gpu:0")
    print("GPU")
else:
    paddle.device.set_device("cpu")
    print("CPU")

# Single load at import — do not construct PaddleOCR inside per-image loops.
# Tuned for speed: no angle cls, quieter logs, slightly stricter det box filter.
# Set PADDLE_OCR_USE_ANGLE_CLS=1 if receipts need 180° rotation handling.
_USE_ANGLE_CLS = _env_bool("PADDLE_OCR_USE_ANGLE_CLS", "0")
_SHOW_LOG = _env_bool("PADDLE_OCR_SHOW_LOG", "0")
_DET_DB_BOX_THRESH = _env_float("PADDLE_OCR_DET_DB_BOX_THRESH", 0.7)
_DET_LIMIT_SIDE_LEN = int(_env_float("PADDLE_OCR_DET_LIMIT_SIDE_LEN", 960.0))

ocr_engine = PaddleOCR(
    use_angle_cls=_USE_ANGLE_CLS,
    show_log=_SHOW_LOG,
    det_db_box_thresh=_DET_DB_BOX_THRESH,
    det_limit_side_len=_DET_LIMIT_SIDE_LEN,
    lang="en",
    use_gpu=_USE_GPU,
)

def run_ocr(cleaned_image) -> dict:
    start = time.time()

    # ndarray avoids temp JPEG + disk I/O (PaddleOCR accepts ndarray; 2D gray → BGR in check_img).
    result = ocr_engine.ocr(cleaned_image, cls=_USE_ANGLE_CLS)

    # Extract text
    lines = result[0] if result and result[0] else []
    full_text = "\n".join([line[1][0] for line in lines])

    duration_ms = int((time.time() - start) * 1000)

    return {
        "full_text": full_text,
        "duration_ms": duration_ms,
    }
