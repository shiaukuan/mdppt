# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Markdown Slide Generator** web application built with Next.js 15, designed to generate presentation slides from markdown content using OpenAI's API. The application allows users to input topics, generate markdown slides via AI, preview them with Marp, and export to PPTX format.

## Key Development Commands

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm start                  # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues automatically
npm run format             # Format code with Prettier
npm run format:check       # Check formatting with Prettier
npm run type-check         # Run TypeScript type checking
```

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS with custom CSS variables
- **State Management**: React Context + Zustand (planned)
- **Preview**: Marp Core for slide rendering
- **Export**: pptxgenjs for PowerPoint generation
- **AI Integration**: OpenAI API for content generation

### Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── layout.tsx        # Root layout with header/footer
│   ├── page.tsx          # Landing page
│   └── globals.css       # Global styles
├── components/           # Reusable UI components (empty)
├── hooks/               # Custom React hooks (empty)
├── lib/                 # Utility functions and services (empty)
└── types/               # TypeScript type definitions (empty)
```

### Planned API Routes

- `POST /api/v1/slides` - Generate slides from topic using OpenAI
- `POST /api/v1/export` - Export markdown to PPTX format

## Implementation Plan

This project follows a detailed 25-step implementation plan (see `plan.md`):

1. **Phase 1 (Steps 1-4)**: Basic Next.js setup and UI layout
2. **Phase 2 (Steps 5-8)**: OpenAI integration and slide generation API
3. **Phase 3 (Steps 9-13)**: Frontend editor and state management
4. **Phase 4 (Steps 14-17)**: Marp preview integration
5. **Phase 5 (Steps 18-20)**: PPTX export functionality
6. **Phase 6 (Steps 21-25)**: Testing, optimization, and deployment

## Key Features (from spec.md)

### Core Requirements

- **FR-1**: Topic input + OpenAI API Key → AI-generated markdown slides
- **FR-2**: Split view: markdown editor (left) + Marp preview (right)
- **FR-3**: Predefined prompt templates with slide separators (`---`)
- **FR-4**: Export to PPTX format
- **FR-5**: Theme switching (low priority)

### Architecture Decisions

- Client-side API key storage (localStorage, not backend)
- Debounced preview updates (< 300ms for ≤ 40 slides)
- Rate limiting: 5 requests/minute per IP for `/api/v1/slides`
- Redis caching with 1-hour TTL (SHA-256 hash of topic+options)
- XSS protection using DOMPurify

## Current State

The project is in its initial setup phase with:

- Basic Next.js 15 project structure established
- Tailwind CSS configured with custom color variables
- Landing page with feature overview
- Empty placeholder directories for components, hooks, lib, and types
- Package.json configured with all necessary dependencies

**Next Steps**: Begin implementing the slide generation API and OpenAI integration (Steps 5-6 in the plan).

## 工作流程

### 進度追蹤

根據 `todo.md` 檔案追蹤專案進度：

- **目前狀態**: 規劃完成，已完成步驟 1（初始化 Next.js 專案）
- **下一步**: 步驟 2 - 建立 API 路由骨架
- 專案分為 6 大階段，共 25 個步驟
- 每個步驟都有明確的完成標準，包含程式碼實作、測試、整合和文件

### 完成任務前的必要檢查

在標記任何任務為完成之前，必須確保：

**測試要求**:

```bash
# 執行所有測試並確保通過
npm test                   # 當測試套件設置完成後
npm run test:unit         # 單元測試（計劃中）
npm run test:integration  # 整合測試（計劃中）
npm run test:e2e          # E2E 測試（計劃中）
```

**Linting 要求**:

```bash
# 確保所有 linting 檢查通過
npm run lint              # ESLint 檢查
npm run type-check        # TypeScript 類型檢查
npm run format:check      # Prettier 格式檢查

# 自動修復問題
npm run lint:fix          # 自動修復 ESLint 問題
npm run format            # 自動格式化程式碼
```

**每個步驟的完成標準**:

- [x] 程式碼實作完成
- [x] 單元測試通過
- [x] 與現有程式碼整合
- [x] 文件更新
- [x] Code review 完成
- [x] Linting 通過
- [x] TypeScript 檢查通過

## Development Notes

- Uses Node 18+ (specified in package.json engines)
- Configured with TypeScript strict mode
- ESLint + Prettier for code quality
- Experimental typedRoutes enabled in Next.js config
- All user API keys stored client-side only for security
- 使用繁體中文進行溝通和文件撰寫
- 把生成的文件都放到 docs/ 底下
