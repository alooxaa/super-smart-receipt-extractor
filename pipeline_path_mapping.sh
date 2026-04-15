#!/bin/bash
VENV=/home/yujiqo/remote/super-smart-receipt-extractor/.venv/lib/python3.10/site-packages

export LD_LIBRARY_PATH=\
$VENV/torch/lib:\
$VENV/nvidia/cudnn/lib:\
$VENV/nvidia/cublas/lib:\
$VENV/nvidia/cuda_nvrtc/lib:\
$VENV/nvidia/cuda_runtime/lib:\
/usr/lib/wsl/lib:\
$LD_LIBRARY_PATH

exec "$@"
