import os

import cv2
import numpy as np

# fastNlMeansDenoising is very slow on multi‑megapixel images. Cap working resolution
# before denoise / deskew; upscale only when the source is small (e.g. phone photo).
# Default 1280 targets ~300–600 ms end-to-end with tuned Paddle; raise for sharper scans.
_MAX_SIDE = int(os.environ.get("RECEIPT_PREPROCESS_MAX_SIDE", "1280"))
_MIN_SIDE_FOR_2X = 700


def deskew(image):
    coords = np.column_stack(np.where(image > 0))
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h),
                              flags=cv2.INTER_CUBIC,
                              borderMode=cv2.BORDER_REPLICATE)
    return rotated


def preprocess(image_path: str = None, image_bytes: bytes = None):
    # Load from path or bytes
    if image_bytes is not None:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    else:
        img = cv2.imread(image_path)

    if img is None:
        raise ValueError("Could not load image. Check image_path/image_bytes.")

    # Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    h0, w0 = gray.shape[:2]
    side = max(h0, w0)

    # Downscale large scans first (dominant cost was NlMeans on 2× upscaled huge images).
    if side > _MAX_SIDE:
        scale = _MAX_SIDE / side
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        h0, w0 = gray.shape[:2]
        side = max(h0, w0)

    # 2× only for small inputs; never stack 2× on top of an already large image.
    if side < _MIN_SIDE_FOR_2X:
        gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
        h0, w0 = gray.shape[:2]
        side = max(h0, w0)
        if side > _MAX_SIDE:
            scale = _MAX_SIDE / side
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

    # Smaller search window than default (21) — much faster, similar for receipts.
    denoised = cv2.fastNlMeansDenoising(
        gray, h=10, templateWindowSize=7, searchWindowSize=11
    )

    # CLAHE contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # Adaptive threshold
    thresh = cv2.adaptiveThreshold(
        enhanced, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )

    # Deskew
    result = deskew(thresh)

    return result