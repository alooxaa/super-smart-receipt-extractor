"""Run pipeline on one receipt image.

Usage:
    python -m cv_pipeline.test_one --image test_images/receipt1.jpg
"""

import argparse
import json

from cv_pipeline.pipeline import process_receipt


def main() -> None:
    parser = argparse.ArgumentParser(description="Test receipt pipeline on one image")
    parser.add_argument("--image", required=True, help="Path to receipt image")
    args = parser.parse_args()

    output = process_receipt(image_path=args.image)
    print(json.dumps(output, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
