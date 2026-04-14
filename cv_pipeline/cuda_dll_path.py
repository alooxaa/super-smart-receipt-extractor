"""On Windows, prepend NVIDIA pip wheel `bin` folders to PATH so Paddle GPU finds cuDNN/cuBLAS.

Call `ensure_cuda_dll_paths()` before importing `paddle`. Safe no-op if packages are missing.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path


def ensure_cuda_dll_paths() -> None:
    if sys.platform != "win32":
        return
    try:
        import nvidia.cublas  # type: ignore
        import nvidia.cuda_nvrtc  # type: ignore
        import nvidia.cudnn  # type: ignore
    except Exception:
        return

    bins: list[Path] = []
    for mod in (nvidia.cudnn, nvidia.cublas, nvidia.cuda_nvrtc):
        b = Path(mod.__file__).resolve().parent / "bin"
        if b.is_dir():
            bins.append(b)

    if not bins:
        return

    prefix = os.pathsep.join(str(b) for b in bins)
    path = os.environ.get("PATH", "")
    os.environ["PATH"] = prefix + os.pathsep + path
