# CV pipeline results

This folder holds **repeatable artifacts** for benchmarks and a **sample end-to-end extraction** (JSON + optional receipt image).

## 1. Sample receipt image (add yourself)

Markdown and many tools can show a local image next to the notes:

1. Copy the image you used with `test_one` into this folder, e.g.  
   `cp /path/to/your/receipt.jpg ./results/receipt_sample.jpg`
2. The section below will render once `receipt_sample.jpg` exists (same directory as this file).

![Sample receipt used for sample_extraction.json](receipt_sample.jpg)

*If the image is missing, viewers may show a broken image — that is expected until you add the file.*

## 2. Single-image extraction (`test_one`)

Saved copy: [`sample_extraction.json`](sample_extraction.json) — full OCR text, parsed `fields`, `duration_ms`.

**Command used:**

```bash
python -m cv_pipeline.test_one --image "$IMG_PATH"
```

## 3. Benchmark — 200 SROIE test images

Raw log: [`benchmark_sroie_200.txt`](benchmark_sroie_200.txt)

| Metric | Value |
|--------|--------|
| Images | 200 |
| Warmup (excluded) | 5 |
| Preload | yes (read bytes once) |
| Device | `gpu:0`, CUDA compiled |
| **avg_ms** (full pipeline) | **276.57** |
| stdev_ms | 60.55 |
| min_ms | 151.39 |
| max_ms | 553.93 |
| **ocr_duration_ms_avg** | **191.05** |

**Command:**

```bash
python -m cv_pipeline.benchmark_images --limit 200 --warmup 5
```

## 4. Reproducing

- Dataset: `python -m cv_pipeline.download_sroie` (KaggleHub cache path may differ slightly by version).
- Environment: GPU + Paddle GPU wheel; see project `README.md` / `cv_pipeline` for CUDA notes.
