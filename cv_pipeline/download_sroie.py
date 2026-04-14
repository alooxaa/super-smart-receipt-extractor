"""Download SROIE dataset from KaggleHub.

Usage:
    python -m cv_pipeline.download_sroie
"""

import kagglehub


def main() -> None:
    path = kagglehub.dataset_download("urbikn/sroie-datasetv2")
    print("SROIE downloaded to:", path)


if __name__ == "__main__":
    main()
