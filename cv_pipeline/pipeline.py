from .extractor import extract_fields
from .ocr import run_ocr
from .preprocess import preprocess


def process_receipt(image_path: str = None, image_bytes: bytes = None) -> dict:
    """Process a receipt image using preprocessing + pretrained PaddleOCR."""
    if not image_path and image_bytes is None:
        raise ValueError("Provide either image_path or image_bytes.")

    # Step 1 - Preprocess
    cleaned = preprocess(image_path=image_path, image_bytes=image_bytes)

    # Step 2 - OCR
    ocr_result = run_ocr(cleaned)

    # Step 3 - Extract fields
    fields = extract_fields(ocr_result["full_text"])

    return {
        "full_text": ocr_result["full_text"],
        "fields": fields,
        "method": "paddleocr",
        "duration_ms": ocr_result["duration_ms"],
    }