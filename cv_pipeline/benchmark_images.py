"""Measure average wall-clock time for `process_receipt` over many images.

Uses GPU when Paddle is built with CUDA, cuDNN is on PATH (see `cuda_dll_path`), and
`PADDLE_OCR_USE_GPU` is not set to 0.

By default, image files are read into RAM once (--preload) so the timed loop does not
re-hit the disk for each iteration. PaddleOCR's public API does not support batched
det+rec for multiple images in one call (list input requires det=False), so throughput
is still one image per forward pass.

Example:
    python -m cv_pipeline.benchmark_images --limit 500
"""

from __future__ import annotations

import argparse
import logging
import random
import statistics
import sys
import time
from pathlib import Path


def _default_sroie_test_img_dir() -> Path:
    return (
        Path.home()
        / ".cache"
        / "kagglehub"
        / "datasets"
        / "urbikn"
        / "sroie-datasetv2"
        / "versions"
        / "4"
        / "SROIE2019"
        / "test"
        / "img"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark receipt pipeline timing")
    parser.add_argument(
        "--img-dir",
        type=Path,
        default=None,
        help="Folder with receipt images (.jpg). Default: SROIE test/img under kagglehub cache.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=500,
        help="Max images (default 500). Use 0 for all images in the folder.",
    )
    parser.add_argument(
        "--warmup",
        type=int,
        default=5,
        help="Images to run before averaging (default 5), not counted in stats.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Shuffle seed when sampling images (default 42). Use -1 for no shuffle.",
    )
    parser.add_argument(
        "--no-preload",
        action="store_true",
        help="Read each image from disk inside the loop (default: read all bytes once).",
    )
    args = parser.parse_args()

    img_dir = args.img_dir or _default_sroie_test_img_dir()
    if not img_dir.is_dir():
        print(f"Image folder not found: {img_dir}", file=sys.stderr)
        sys.exit(1)

    patterns = ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG")
    paths: list[Path] = []
    for pat in patterns:
        paths.extend(img_dir.glob(pat))
    paths = sorted({p.resolve() for p in paths})
    if not paths:
        print(f"No images under {img_dir}", file=sys.stderr)
        sys.exit(1)

    if args.seed >= 0:
        rng = random.Random(args.seed)
        rng.shuffle(paths)

    if args.limit and args.limit > 0:
        paths = paths[: args.limit]

    # Import after argparse so `--help` works without loading heavy deps
    from .cuda_dll_path import ensure_cuda_dll_paths

    ensure_cuda_dll_paths()

    for _name in ("ppocr", "paddle", "paddleocr"):
        logging.getLogger(_name).setLevel(logging.WARNING)

    from .pipeline import process_receipt

    import cv2
    import numpy as np
    import paddle

    print("device:", paddle.device.get_device())
    print("compiled_cuda:", paddle.device.is_compiled_with_cuda())
    print("images:", len(paths), "from", img_dir)
    print("warmup (excluded from avg):", args.warmup)
    print("preload:", not args.no_preload)

    warmup = min(args.warmup, len(paths))
    bench_paths = paths[warmup:]
    if not bench_paths:
        print("Nothing to benchmark after warmup; increase --limit.", file=sys.stderr)
        sys.exit(1)

    preload_map: dict[Path, bytes] = {}
    if not args.no_preload:
        for p in paths:
            preload_map[p] = p.read_bytes()

    def _sync_gpu() -> None:
        dev = str(paddle.device.get_device())
        if dev.startswith("gpu") and paddle.device.is_compiled_with_cuda():
            paddle.device.cuda.synchronize()

    def _run_one(p: Path) -> dict:
        if args.no_preload:
            return process_receipt(image_path=str(p))
        return process_receipt(image_bytes=preload_map[p])

    # Tiny in-RAM JPEG to warm GPU + Python path before dataset images.
    _, buf = cv2.imencode(".jpg", np.ones((64, 64, 3), dtype=np.uint8) * 255)
    process_receipt(image_bytes=buf.tobytes())
    _sync_gpu()

    for p in paths[:warmup]:
        _run_one(p)
        _sync_gpu()

    times_ms: list[float] = []
    ocr_reported_ms: list[float] = []
    for p in bench_paths:
        t0 = time.perf_counter()
        out = _run_one(p)
        _sync_gpu()
        dt_ms = (time.perf_counter() - t0) * 1000.0
        times_ms.append(dt_ms)
        ocr_reported_ms.append(float(out.get("duration_ms", 0)))

    mean_ms = statistics.mean(times_ms)
    stdev_ms = statistics.pstdev(times_ms) if len(times_ms) > 1 else 0.0
    print("--- wall clock (full pipeline: preprocess + OCR + extract) ---")
    print("avg_ms:", round(mean_ms, 2))
    print("stdev_ms:", round(stdev_ms, 2))
    print("min_ms:", round(min(times_ms), 2))
    print("max_ms:", round(max(times_ms), 2))
    print("ocr_duration_ms_avg (from OCR step only):", round(statistics.mean(ocr_reported_ms), 2))


if __name__ == "__main__":
    main()
