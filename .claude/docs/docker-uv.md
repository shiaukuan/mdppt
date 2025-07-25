# 使用 UV 的 Python 多階段 Dockerfile

## 基本結構

```dockerfile
# Stage 1: 建置相依性
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim as builder

# 設定工作目錄
WORKDIR /app

# 複製相依檔案
COPY pyproject.toml uv.lock ./

# 安裝相依性到虛擬環境
RUN uv sync --frozen --no-cache

# Stage 2: Runtime
FROM debian:bookworm-slim

# 為 runtime 安裝 uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# 設定工作目錄
WORKDIR /app

# 從 builder stage 複製虛擬環境
COPY --from=builder /app/.venv /app/.venv

# 複製應用程式碼
COPY . .

# 確保我們使用虛擬環境
ENV PATH="/app/.venv/bin:$PATH"

# 執行應用程式
CMD ["uv", "run", "python", "main.py"]
```

## 主要優勢

- **更小的最終 image**：建置相依性不包含在最終 image 中
- **更快的建置**：UV 在相依性解析方面的速度優勢
- **更好的快取**：相依性安裝與程式碼變更分別快取
- **安全性**：production image 中沒有建置工具

## 必要命令

### UV 安裝

```dockerfile
# 直接使用 UV 的 Python images
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

# 或在最小 base 上安裝 UV
FROM debian:bookworm-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
```

### 相依性管理

```dockerfile
# 同步相依性（等同於 pip install）
RUN uv sync --frozen --no-cache

# 僅用於 production 相依性
RUN uv sync --frozen --no-cache --no-dev
```

### 環境變數

```dockerfile
# 使用虛擬環境
ENV PATH="/app/.venv/bin:$PATH"

# 可選：設定 UV cache 目錄
ENV UV_CACHE_DIR=/tmp/uv-cache
```

## 進階範例

```dockerfile
# 建置 stage
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim as builder

# 安裝建置用的系統相依性
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 複製並安裝相依性
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache --no-dev

# Production stage
FROM debian:bookworm-slim

# 安裝 uv 和 runtime 相依性
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# 建立非 root 使用者
RUN useradd --create-home --shell /bin/bash app

WORKDIR /app

# 複製虛擬環境
COPY --from=builder /app/.venv /app/.venv

# 複製應用程式碼
COPY --chown=app:app . .

# 切換到非 root 使用者
USER app

# 啟用虛擬環境
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uv", "run", "python", "main.py"]
```

## 提示

1. **順序很重要**：在應用程式碼之前複製 `pyproject.toml` 和 `uv.lock` 以獲得更好的快取
2. **使用 `--frozen`**：確保來自 lockfile 的確切相依版本
3. **使用 `--no-cache`**：防止 UV cache 使 image 變大
4. **考慮 `--no-dev`**：在 production 中跳過開發相依性
5. **設定 PATH**：確保虛擬環境正確啟用
