# Floor Plan Detection API - Docker Image
# Lightweight mmdetection setup for floor plan wall/room detection

FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    python-multipart \
    opencv-python-headless \
    numpy \
    pillow

# Install mmdetection ecosystem
RUN pip install --no-cache-dir openmim && \
    mim install mmengine && \
    mim install "mmcv>=2.0.0rc4,<2.2.0" && \
    mim install mmdet

# Copy application files
COPY run.py .
COPY configs/ ./configs/
COPY weights/ ./weights/
COPY visualizer.html .
COPY utils/ ./utils/

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run the server
CMD ["python", "run.py", "--model", "cascade_swin", "--port", "5000"]
