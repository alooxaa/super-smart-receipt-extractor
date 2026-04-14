

## CV dataset + reproduction guide

### Dataset used
- Kaggle: `urbikn/sroie-datasetv2`
- Link: https://www.kaggle.com/datasets/urbikn/sroie-datasetv2

### Where dataset logic is in code
- `cv_pipeline/download_sroie.py` - downloads dataset from KaggleHub:
  - `kagglehub.dataset_download("urbikn/sroie-datasetv2")`
- `cv_pipeline/benchmark_images.py` - uses downloaded SROIE test images from:
  - `~/.cache/kagglehub/datasets/urbikn/sroie-datasetv2/versions/4/SROIE2019/test/img`

### CV pipeline files
- `cv_pipeline/preprocess.py` - image cleaning (grayscale, denoise, threshold, deskew)
- `cv_pipeline/ocr.py` - PaddleOCR runner (GPU/CPU selection)
- `cv_pipeline/extractor.py` - rule-based extraction (company/date/total/address)
- `cv_pipeline/pipeline.py` - final `process_receipt(...)` orchestration
- `cv_pipeline/test_one.py` - run pipeline on one image and print JSON
- `cv_pipeline/benchmark_images.py` - average timing over many images

### Re-run from scratch (for another contributor)
1. Clone and switch to your branch:
```bash
git clone https://github.com/yujiqo/super-smart-receipt-extractor.git
cd super-smart-receipt-extractor
git checkout cv-model
```

2. Create Python 3.11 virtual environment:
```bash
py -3.11 -m venv .venv311
.\.venv311\Scripts\python -m pip install --upgrade pip
```

3. Install dependencies (CPU default):
```bash
.\.venv311\Scripts\python -m pip install paddleocr opencv-python numpy kagglehub
```

4. Download SROIE dataset:
```bash
.\.venv311\Scripts\python -m cv_pipeline.download_sroie
```

5. Test on one image:
```bash
.\.venv311\Scripts\python -m cv_pipeline.test_one --image "C:\Users\<your-user>\.cache\kagglehub\datasets\urbikn\sroie-datasetv2\versions\4\SROIE2019\test\img\X00016469670.jpg"
```

6. Benchmark average time:
```bash
.\.venv311\Scripts\python -m cv_pipeline.benchmark_images --limit 500 --warmup 5
```

### GPU note (Windows + NVIDIA)
- If CUDA/cuDNN are configured, `cv_pipeline/ocr.py` automatically uses GPU.
- To force CPU run:
```bash
set PADDLE_OCR_USE_GPU=0
```
