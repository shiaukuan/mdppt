### uv 實戰手冊（程式碼生成就緒，無需 Bootstrap）

_假設：`uv` 已安裝且在 `PATH` 中可用。_

---

## 0 — 基本檢查

```bash
uv --version               # 驗證安裝；返回 0
```

如果命令失敗，停止並回報給使用者。

---

## 1 — 日常工作流程

### 1.1 專案（「cargo 風格」）流程

```bash
uv init myproj                     # ① 建立 pyproject.toml + .venv
cd myproj
uv add ruff pytest httpx           # ② 快速解析器 + lock 更新
uv run pytest -q                   # ③ 在專案 venv 中執行測試
uv lock                            # ④ 刷新 uv.lock（如需要）
uv sync --locked                   # ⑤ 可重現安裝（CI 安全）
```

### 1.2 以 Script 為中心的流程（PEP 723）

```bash
echo 'print("hi")' > hello.py
uv run hello.py                    # 零相依 script，自動環境
uv add --script hello.py rich      # 嵌入相依 metadata
uv run --with rich hello.py        # 暫時相依，無狀態
```

### 1.3 CLI 工具（pipx 替代）

```bash
uvx ruff check .                   # 短暫執行
uv tool install ruff               # 使用者範圍的持久安裝
uv tool list                       # 審核已安裝的 CLI
uv tool update --all               # 保持最新
```

### 1.4 Python 版本管理

```bash
uv python install 3.10 3.11 3.12
uv python pin 3.12                 # 寫入 .python-version
uv run --python 3.10 script.py
```

### 1.5 舊版 Pip 介面

```bash
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
uv pip sync   -r requirements.txt   # 確定性安裝
```

---

## 2 — 效能調優參數

| 環境變數                  | 用途               | 典型值       |
| ------------------------- | ------------------ | ------------ |
| `UV_CONCURRENT_DOWNLOADS` | 飽和大頻寬         | `16` 或 `32` |
| `UV_CONCURRENT_INSTALLS`  | 並行 wheel 安裝    | `CPU_CORES`  |
| `UV_OFFLINE`              | 強制僅快取模式     | `1`          |
| `UV_INDEX_URL`            | 內部鏡像           | `https://…`  |
| `UV_PYTHON`               | 在 CI 中固定解釋器 | `3.11`       |
| `UV_NO_COLOR`             | 停用 ANSI 顏色     | `1`          |

其他實用命令：

```bash
uv cache dir && uv cache info      # 顯示路徑 + 統計
uv cache clean                     # 清除 wheels 和 sources
```

---

## 3 — CI/CD 配方

### 3.1 GitHub Actions

```yaml
# .github/workflows/test.yml
name: tests
on: [push]
jobs:
  pytest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5 # 安裝 uv，恢復快取
      - run: uv python install # 遵守 .python-version
      - run: uv sync --locked # 恢復環境
      - run: uv run pytest -q
```

### 3.2 Docker

```dockerfile
FROM ghcr.io/astral-sh/uv:0.7.4 AS uv
FROM python:3.12-slim

COPY --from=uv /usr/local/bin/uv /usr/local/bin/uv
COPY pyproject.toml uv.lock /app/
WORKDIR /app
RUN uv sync --production --locked
COPY . /app
CMD ["uv", "run", "python", "-m", "myapp"]
```

---

## 4 — 遷移對照表

| 舊工具 / 概念       | 一次性替代               | 註記             |
| ------------------- | ------------------------ | ---------------- |
| `python -m venv`    | `uv venv`                | 建立速度快 10 倍 |
| `pip install`       | `uv pip install`         | 相同 flags       |
| `pip-tools compile` | `uv pip compile`（隱含） | 透過 `uv lock`   |
| `pipx run`          | `uvx` / `uv tool run`    | 無需全域 Python  |
| `poetry add`        | `uv add`                 | pyproject 原生   |
| `pyenv install`     | `uv python install`      | 快取的 tarballs  |

---

## 5 — 疑難排解快速路徑

| 症狀                   | 解決方案                                                       |
| ---------------------- | -------------------------------------------------------------- |
| `Python X.Y not found` | `uv python install X.Y` 或設定 `UV_PYTHON`                     |
| Proxy 限制下載         | `UV_HTTP_TIMEOUT=120 UV_INDEX_URL=https://mirror.local/simple` |
| C 擴展建置錯誤         | `unset UV_NO_BUILD_ISOLATION`                                  |
| 需要全新環境           | `uv cache clean && rm -rf .venv && uv sync`                    |
| 仍然卡住？             | `RUST_LOG=debug uv ...` 並在 GitHub 開 issue                   |

---

## 6 — 高層推銷（30 秒）

```text
• 單一執行檔提供 10–100 倍更快的相依性和環境管理。
• 通用 lockfile ⇒ 在 macOS / Linux / Windows / ARM / x86 上相同建置。
• 由 Ruff 團隊支援；大約每月發布新版本。
```

---

## 7 — Agent 小抄（複製/貼上）

```bash
# 新專案
a=$PWD && uv init myproj && cd myproj && uv add requests rich

# 測試執行
uv run python -m myproj ...

# lock + CI 恢復
uv lock && uv sync --locked

# 臨時 script
uv add --script tool.py httpx
uv run tool.py

# 管理 CLI 工具
uvx ruff check .
uv tool install pre-commit

# Python 版本
uv python install 3.12
uv python pin 3.12
```

---

_手冊結束_
