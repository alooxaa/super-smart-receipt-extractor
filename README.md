# Super Smart Receipt Extractor — Benchmark & Setup Guide

This project uses a **PaddleOCR-based** pipeline to extract text and structured fields from receipt images.  
It includes a **benchmarking** script to measure full pipeline performance (preprocess + OCR + extraction).

---

## 1. Environment setup (Linux)

### Step 1: Clone repository

```bash
git clone <your-repo-url>
cd super-smart-receipt-extractor
```

### Step 2: Create virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Install **PaddlePaddle** to match your machine (GPU wheel must match your CUDA version; CPU build if no GPU):

```bash
# Example: GPU + CUDA 11.7 (adjust index / version per https://www.paddlepaddle.org.cn/install/quick )
pip install paddlepaddle-gpu==2.6.1.post117 -i https://www.paddlepaddle.org.cn/packages/stable/cu117/

# Or CPU-only:
# pip install paddlepaddle
```

Ensure `nvcc` / `CUDA_HOME` are on `PATH` / `LD_LIBRARY_PATH` when using the GPU build.

---

## 2. Dataset setup (SROIE)

The benchmark uses the **SROIE** dataset via **KaggleHub**.

### Step 1: Download dataset

```bash
python -m cv_pipeline.download_sroie
```

### Step 2: Verify dataset path

Default cache layout (version folder may differ):

```text
~/.cache/kagglehub/datasets/urbikn/sroie-datasetv2/
```

Check test images:

```bash
ls ~/.cache/kagglehub/datasets/urbikn/sroie-datasetv2/versions/4/SROIE2019/test/img | head
```

Dataset on Kaggle: [urbikn/sroie-datasetv2](https://www.kaggle.com/datasets/urbikn/sroie-datasetv2)

---

## 3. Run full benchmark

Runs the pipeline over many images and prints average wall-clock time (and average OCR-reported time).

```bash
python -m cv_pipeline.benchmark_images --limit 200 --warmup 5
```

**Parameters**

| Flag | Meaning |
|------|--------|
| `--limit 200` | Max number of images to process |
| `--warmup 5` | Warmup runs excluded from the average |
| `--img-dir` | Optional custom folder of images (default: SROIE `test/img` under KaggleHub cache) |
| `--no-preload` | Read each file from disk every iteration (default: preload bytes once) |

**Example with explicit image directory**

```bash
python -m cv_pipeline.benchmark_images \
  --img-dir "$HOME/.cache/kagglehub/datasets/urbikn/sroie-datasetv2/versions/4/SROIE2019/test/img" \
  --limit 200 \
  --warmup 5
```

Sample documented numbers and artifacts: see [`results/`](results/).

---

## 4. Run single-image test

```bash
python -m cv_pipeline.test_one --image "<IMAGE_PATH>"
```

**Example**

```bash
IMG="$HOME/.cache/kagglehub/datasets/urbikn/sroie-datasetv2/versions/4/SROIE2019/test/img/X51005746206.jpg"
python -m cv_pipeline.test_one --image "$IMG"
```

---

## 5. View dataset images (GUI)

Open one file:

```bash
xdg-open "<IMAGE_PATH>"
```

Random image from the default test folder:

```bash
F=$(ls "$HOME/.cache/kagglehub/datasets/urbikn/sroie-datasetv2/versions/4/SROIE2019/test/img" | shuf -n 1)
xdg-open "$HOME/.cache/kagglehub/datasets/urbikn/sroie-datasetv2/versions/4/SROIE2019/test/img/$F"
```

---

## 6. GPU setup (optional, recommended)

Check the GPU:

```bash
nvidia-smi
```

Typical environment (adjust paths to your CUDA install):

```bash
export CUDA_HOME=/usr/local/cuda-11.7
export PATH="$CUDA_HOME/bin:$PATH"
export LD_LIBRARY_PATH="$CUDA_HOME/lib64:${LD_LIBRARY_PATH:-}"
export CUDA_VISIBLE_DEVICES=0
```

`cv_pipeline/ocr.py` uses the GPU when Paddle is built with CUDA and a device is visible. To **force CPU**:

```bash
export PADDLE_OCR_USE_GPU=0
```

---

## 7. Notes

- First runs can be slower (model download, warmup).
- The benchmark measures the **full** path: preprocessing → detection → recognition → rule-based field extraction.
- Throughput depends on GPU, driver, CUDA/cuDNN, and input resolution (see `RECEIPT_PREPROCESS_MAX_SIDE` and related env vars in `cv_pipeline/preprocess.py` / `ocr.py`).

---

## 8. Troubleshooting

**Dataset not found**

```bash
python -m cv_pipeline.download_sroie
```

**PaddleOCR slow**

- Confirm GPU: `nvidia-smi`, Paddle `paddle.device.get_device()`.
- Model is loaded **once** at import in `ocr.py` (not per image).
- Preprocess caps image size; avoid huge scans without downscaling.

**CUDA not detected**

- Run `nvidia-smi`. If it fails, fix drivers first.
- Install a `paddlepaddle-gpu` build that matches your CUDA version.

---

## 9. Project structure

```text
cv_pipeline/
  benchmark_images.py   # timing over many images
  test_one.py           # single image → JSON
  download_sroie.py     # KaggleHub download
  pipeline.py           # orchestrates preprocess → OCR → extract
  preprocess.py         # grayscale, denoise, threshold, deskew
  ocr.py                # PaddleOCR (GPU/CPU), env-tunable
  extractor.py          # company / date / total / address heuristics
  cuda_dll_path.py      # Windows: CUDA DLL path helper
results/                # optional benchmark notes + sample JSON (+ receipt image)
requirements.txt        # pip deps (Paddle installed separately)
```
