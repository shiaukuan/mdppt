import { PromptTemplate } from './types';

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  basic: {
    id: 'basic',
    name: '基礎簡報',
    description: '適合一般用途的簡報格式',
    template: `請根據主題「{{topic}}」生成一個專業的 Markdown 簡報。

要求：
1. 生成 8-12 張投影片
2. 使用 Marp 格式，每張投影片用 "---" 分隔
3. 第一張為標題頁，包含主標題和副標題
4. 包含目錄頁
5. 每張投影片應有清晰的標題和重點內容
6. 最後一張為結論或感謝頁
7. 內容要專業、簡潔、易懂
8. 使用適當的 Markdown 格式（標題、列表、粗體等）

請直接輸出 Markdown 格式的投影片內容，不要包含額外說明。`,
    variables: ['topic'],
    maxSlides: 12
  },

  academic: {
    id: 'academic',
    name: '學術報告',
    description: '適合學術研究和論文發表',
    template: `請根據主題「{{topic}}」生成一個學術風格的 Markdown 簡報。

要求：
1. 生成 12-16 張投影片
2. 使用 Marp 格式，每張投影片用 "---" 分隔
3. 包含以下結構：
   - 標題頁（研究主題、作者、機構、日期）
   - 研究背景與動機
   - 文獻回顧
   - 研究方法
   - 結果與分析
   - 討論
   - 結論與未來工作
   - 參考文獻
4. 內容要嚴謹、有邏輯性
5. 使用學術寫作風格
6. 適當引用相關概念和理論

請直接輸出 Markdown 格式的投影片內容，不要包含額外說明。`,
    variables: ['topic'],
    maxSlides: 16
  },

  business: {
    id: 'business',
    name: '商業提案',
    description: '適合商業簡報和提案展示',
    template: `請根據主題「{{topic}}」生成一個商業風格的 Markdown 簡報。

要求：
1. 生成 10-14 張投影片
2. 使用 Marp 格式，每張投影片用 "---" 分隔
3. 包含以下結構：
   - 標題頁
   - 執行摘要
   - 問題定義
   - 解決方案
   - 市場分析
   - 商業模式
   - 財務預測
   - 實施計劃
   - 風險評估
   - 結論與下一步
4. 內容要具說服力、數據導向
5. 強調價值主張和投資回報
6. 使用商業術語和專業表達

請直接輸出 Markdown 格式的投影片內容，不要包含額外說明。`,
    variables: ['topic'],
    maxSlides: 14
  },

  creative: {
    id: 'creative',
    name: '創意展示',
    description: '適合創意項目和設計展示',
    template: `請根據主題「{{topic}}」生成一個創意風格的 Markdown 簡報。

要求：
1. 生成 8-10 張投影片
2. 使用 Marp 格式，每張投影片用 "---" 分隔
3. 包含以下結構：
   - 創意標題頁
   - 靈感來源
   - 概念發展
   - 設計過程
   - 創意亮點
   - 視覺展示
   - 技術實現
   - 成果展示
   - 未來展望
4. 內容要富有創意、視覺化
5. 使用生動的描述和比喻
6. 強調創新性和獨特性
7. 適合加入表情符號和視覺元素

請直接輸出 Markdown 格式的投影片內容，不要包含額外說明。`,
    variables: ['topic'],
    maxSlides: 10
  }
};

export function replaceTemplateVariables(
  template: string, 
  variables: Record<string, string>
): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return result;
}

export function validateTemplateVariables(
  templateId: string, 
  variables: Record<string, string>
): { isValid: boolean; missingVariables: string[] } {
  const template = PROMPT_TEMPLATES[templateId];
  
  if (!template) {
    return { isValid: false, missingVariables: [] };
  }
  
  const missingVariables = template.variables.filter(
    variable => !variables[variable] || variables[variable].trim() === ''
  );
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables
  };
}

export function getPromptForTemplate(
  templateId: string, 
  variables: Record<string, string>
): string {
  const template = PROMPT_TEMPLATES[templateId];
  
  if (!template) {
    throw new Error(`Template with id '${templateId}' not found`);
  }
  
  const validation = validateTemplateVariables(templateId, variables);
  if (!validation.isValid) {
    throw new Error(
      `Missing required variables: ${validation.missingVariables.join(', ')}`
    );
  }
  
  return replaceTemplateVariables(template.template, variables);
}