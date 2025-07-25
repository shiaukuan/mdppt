# API 測試指令

## 啟動開發伺服器

```bash
npm run dev
```

## 測試投影片生成 API

### 基本請求

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-test123456789abcdef" \
  -d '{"topic": "React Hooks"}' | jq .
```

### 完整參數請求

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-test123456789abcdef" \
  -d '{
    "topic": "Python 機器學習",
    "model": "gpt-4o-mini",
    "maxPages": 12,
    "style": "academic",
    "includeCode": true,
    "includeImages": true
  }' | jq .
```

### 測試錯誤情況

```bash
# 缺少 API Key
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -d '{"topic": "React Hooks"}' | jq .

# 無效參數
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-test123456789abcdef" \
  -d '{"topic": "", "maxPages": -1}' | jq .
```

## 測試匯出 API

### PPTX 匯出

```bash
curl -X POST http://localhost:3000/api/v1/export \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "---\n# 測試投影片\n\n這是第一張投影片\n\n---\n\n## 第二張投影片\n\n- 項目一\n- 項目二",
    "format": "pptx",
    "filename": "test-slides"
  }' \
  --output test-slides.pptx
```

### HTML 匯出

```bash
curl -X POST http://localhost:3000/api/v1/export \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "---\n# 測試投影片\n\n這是第一張投影片\n\n---\n\n## 第二張投影片\n\n- 項目一\n- 項目二",
    "format": "html",
    "filename": "test-slides"
  }' \
  --output test-slides.html
```

### 測試錯誤情況

```bash
# 不支援的格式
curl -X POST http://localhost:3000/api/v1/export \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# 測試",
    "format": "invalid"
  }' | jq .
```

## 測試速率限制

```bash
# 快速發送多個請求測試速率限制
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/slides \
    -H "Content-Type: application/json" \
    -H "X-API-Key: sk-test123456789abcdef" \
    -d '{"topic": "測試 '$i'"}' \
    --silent --show-error --fail \
    -w "Request $i: %{http_code}\n" || echo "Request $i failed"
  sleep 0.5
done
```

## 測試 CORS

```bash
# OPTIONS 預檢請求
curl -X OPTIONS http://localhost:3000/api/v1/slides \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,X-API-Key" \
  -v
```

## 預期回應格式

### 成功的投影片生成回應

```json
{
  "success": true,
  "data": {
    "id": "sl_123456_abcdef",
    "markdown": "---\n# React Hooks\n\n歡迎來到關於「React Hooks」的簡報\n\n---\n...",
    "tokenUsage": {
      "prompt": 123,
      "completion": 456,
      "total": 579
    },
    "createdAt": "2025-07-24T09:00:00.000Z",
    "config": {
      "model": "gpt-4o-mini",
      "maxPages": 15,
      "style": "default",
      "includeCode": true,
      "includeImages": false
    }
  },
  "timestamp": "2025-07-24T09:00:00.000Z"
}
```

### 錯誤回應

```json
{
  "success": false,
  "error": {
    "message": "缺少必要欄位: topic",
    "code": "INVALID_INPUT",
    "details": {
      "errors": ["缺少必要欄位: topic"]
    }
  },
  "timestamp": "2025-07-24T09:00:00.000Z"
}
```
