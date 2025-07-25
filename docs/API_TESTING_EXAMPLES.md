# API 測試範例與 cURL 命令

本文檔提供完整的 `/api/v1/slides` 端點測試範例，包含 cURL 命令、預期回應和常見錯誤處理。

## 目錄

1. [基本 API 測試](#基本-api-測試)
2. [進階功能測試](#進階功能測試)
3. [錯誤處理測試](#錯誤處理測試)
4. [快取測試](#快取測試)
5. [性能測試](#性能測試)

## 基本 API 測試

### 1. 基礎投影片生成

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d '{
    "topic": "React Hooks 入門教學",
    "language": "zh-TW",
    "targetAudience": "beginner"
  }'
```

**預期回應**:

```json
{
  "success": true,
  "data": {
    "id": "sl_123456_abcdef",
    "markdown": "# React Hooks 入門教學\n\n## 一個深入了解 React Hooks 的基礎知識\n\n---\n\n## 目錄\n\n1. 什麼是 React Hooks？\n2. useState Hook\n3. useEffect Hook\n...",
    "tokenUsage": {
      "prompt": 264,
      "completion": 1001,
      "total": 1265,
      "estimatedCost": {
        "usd": 0.0019,
        "currency": "USD"
      }
    },
    "createdAt": "2025-07-25T10:30:00.000Z",
    "config": {
      "model": "gpt-3.5-turbo",
      "maxPages": 10,
      "style": "default",
      "language": "zh-TW",
      "targetAudience": "beginner"
    },
    "metadata": {
      "slideCount": 12,
      "wordCount": 450,
      "codeBlockCount": 2,
      "imageCount": 0,
      "estimatedReadingTime": 3,
      "tags": ["frontend", "javascript", "ui", "web"],
      "difficulty": "beginner",
      "openaiMetadata": {
        "model": "gpt-3.5-turbo",
        "generatedAt": "2025-07-25T10:30:00.000Z"
      }
    }
  },
  "requestId": "req_1234567890abcdef"
}
```

### 2. 學術風格投影片

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d '{
    "topic": "機器學習演算法比較研究",
    "targetAudience": "expert",
    "slideFormat": "academic",
    "tone": "professional",
    "model": "gpt-4o",
    "maxPages": 15
  }'
```

### 3. 商業提案風格

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d '{
    "topic": "人工智慧解決方案商業計劃",
    "slideFormat": "business",
    "tone": "professional",
    "targetAudience": "intermediate",
    "includeCode": false,
    "includeImages": true
  }'
```

## 進階功能測試

### 4. 包含程式碼範例

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d '{
    "topic": "Python Flask API 開發",
    "includeCode": true,
    "includeImages": false,
    "targetAudience": "intermediate",
    "language": "zh-TW"
  }'
```

### 5. 創意風格投影片

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d '{
    "topic": "設計思維工作坊",
    "tone": "friendly",
    "style": "modern",
    "targetAudience": "beginner",
    "slideFormat": "tutorial"
  }'
```

### 6. 使用 Bearer Token 認證

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-your-openai-api-key" \
  -d '{
    "topic": "Docker 容器化技術",
    "targetAudience": "intermediate"
  }'
```

## 錯誤處理測試

### 7. 缺少必要參數

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d '{
    "model": "gpt-3.5-turbo"
  }'
```

**預期回應**:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求參數驗證失敗",
    "details": {
      "field": "topic",
      "message": "主題是必填欄位"
    }
  },
  "requestId": "req_error_123"
}
```

### 8. 無效的 API Key

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid-api-key" \
  -d '{
    "topic": "測試主題"
  }'
```

**預期回應**:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求參數驗證失敗",
    "details": {
      "field": "apiKey",
      "message": "API Key 格式無效"
    }
  },
  "requestId": "req_error_456"
}
```

### 9. 缺少 API Key

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "測試主題"
  }'
```

**預期回應**:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求參數驗證失敗",
    "details": {
      "field": "apiKey",
      "message": "API Key 是必填欄位"
    }
  },
  "requestId": "req_error_789"
}
```

### 10. 無效的 JSON 格式

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d 'invalid json format'
```

**預期回應**:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "無效的 JSON 格式",
    "details": {
      "parseError": "Unexpected token 'i', \"invalid json format\" is not valid JSON"
    }
  },
  "requestId": "req_error_abc"
}
```

### 11. 方法不允許 (GET)

**請求範例**:

```bash
curl -X GET http://localhost:3000/api/v1/slides
```

**預期回應**:

```json
{
  "success": false,
  "error": {
    "code": "METHOD_NOT_ALLOWED",
    "message": "不支援的 HTTP 方法: GET"
  },
  "requestId": "req_error_def"
}
```

## 快取測試

### 12. 測試快取命中

**第一次請求**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d '{
    "topic": "快取測試主題",
    "targetAudience": "beginner"
  }'
```

**第二次相同請求（應該命中快取）**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d '{
    "topic": "快取測試主題",
    "targetAudience": "beginner"
  }'
```

**觀察**:

- 第二次請求應該明顯更快
- 服務器日誌會顯示 "[API] 快取命中，返回快取結果"

### 13. 測試快取失效（不同參數）

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d '{
    "topic": "快取測試主題",
    "targetAudience": "expert"
  }'
```

**觀察**:

- 即使主題相同，但 `targetAudience` 不同，所以不會命中快取
- 服務器日誌會顯示 "[API] 快取未命中，調用 OpenAI API"

## 性能測試

### 14. 並發請求測試

**使用 GNU Parallel 進行並發測試**:

```bash
# 建立測試腳本
cat > test_concurrent.sh << 'EOF'
#!/bin/bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d "{\"topic\": \"並發測試 $1\"}" \
  -w "Time: %{time_total}s, Status: %{http_code}\n"
EOF

chmod +x test_concurrent.sh

# 執行 5 個並發請求
seq 1 5 | parallel -j 5 ./test_concurrent.sh
```

### 15. 大量資料測試

**請求範例**:

```bash
curl -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-your-openai-api-key" \
  -d '{
    "topic": "深度學習與神經網路架構：從基礎感知機到 Transformer 模型的演進歷程、技術原理、應用場景以及未來發展趨勢的全面性分析研究",
    "maxPages": 20,
    "model": "gpt-4o",
    "targetAudience": "expert",
    "slideFormat": "academic"
  }'
```

## 除錯和監控

### 16. 檢查 API 狀態

**請求範例**:

```bash
curl -X GET http://localhost:3000/api/test \
  -H "Accept: application/json"
```

### 17. 查看快取統計（需要額外的端點）

如果實作了快取統計端點：

```bash
curl -X GET http://localhost:3000/api/v1/cache/stats \
  -H "Accept: application/json"
```

## 自動化測試腳本

### 18. 完整測試套件

```bash
#!/bin/bash

API_KEY="sk-your-openai-api-key"
BASE_URL="http://localhost:3000"
TOTAL_TESTS=0
PASSED_TESTS=0

function run_test() {
    local test_name="$1"
    local expected_status="$2"
    local curl_cmd="$3"

    echo "執行測試: $test_name"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    response=$(eval "$curl_cmd -w '%{http_code}' -s")
    actual_status="${response: -3}"

    if [ "$actual_status" = "$expected_status" ]; then
        echo "✅ $test_name - 通過 (狀態碼: $actual_status)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ $test_name - 失敗 (預期: $expected_status, 實際: $actual_status)"
        echo "回應: ${response%???}"
    fi
    echo ""
}

# 測試 1: 基本成功案例
run_test "基本投影片生成" "200" \
"curl -X POST $BASE_URL/api/v1/slides \
-H 'Content-Type: application/json' \
-H 'x-api-key: $API_KEY' \
-d '{\"topic\": \"測試主題\"}'"

# 測試 2: 缺少主題
run_test "缺少主題參數" "400" \
"curl -X POST $BASE_URL/api/v1/slides \
-H 'Content-Type: application/json' \
-H 'x-api-key: $API_KEY' \
-d '{\"model\": \"gpt-3.5-turbo\"}'"

# 測試 3: 無效 API Key
run_test "無效 API Key" "400" \
"curl -X POST $BASE_URL/api/v1/slides \
-H 'Content-Type: application/json' \
-H 'x-api-key: invalid-key' \
-d '{\"topic\": \"測試主題\"}'"

# 測試 4: 方法不允許
run_test "GET 方法不允許" "405" \
"curl -X GET $BASE_URL/api/v1/slides"

# 輸出測試結果
echo "測試完成!"
echo "總測試數: $TOTAL_TESTS"
echo "通過測試數: $PASSED_TESTS"
echo "失敗測試數: $((TOTAL_TESTS - PASSED_TESTS))"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo "🎉 所有測試都通過了！"
    exit 0
else
    echo "⚠️  有測試失敗，請檢查 API 實作"
    exit 1
fi
```

### 19. 保存測試腳本

將上述腳本保存為 `test_api.sh` 並執行：

```bash
chmod +x test_api.sh
./test_api.sh
```

## 常見問題排除

### API 無回應

```bash
# 檢查服務是否運行
curl -I http://localhost:3000/

# 檢查特定端點
curl -I http://localhost:3000/api/test
```

### 超時問題

```bash
# 增加超時時間
curl --max-time 60 -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"topic": "複雜主題"}'
```

### 詳細除錯

```bash
# 顯示詳細的請求/回應資訊
curl -v -X POST http://localhost:3000/api/v1/slides \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"topic": "測試主題"}'
```

---

## 總結

以上範例涵蓋了 API 的各種使用情況，包括：

- ✅ 基本功能測試
- ✅ 進階參數配置
- ✅ 錯誤處理驗證
- ✅ 快取機制測試
- ✅ 性能和併發測試
- ✅ 自動化測試腳本

使用這些範例可以全面驗證 API 的功能和穩定性。
