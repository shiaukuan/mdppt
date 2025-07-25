// Main exports for the OpenAI service layer
export { OpenAIClient, createOpenAIClient, getDefaultClient, setDefaultClient, initializeDefaultClient } from './client';
export { PROMPT_TEMPLATES, replaceTemplateVariables, validateTemplateVariables, getPromptForTemplate } from './prompts';
export type {
  OpenAIClientConfig,
  OpenAIGenerateOptions,
  SlideGenerationRequest,
  SlideGenerationResponse,
  OpenAIError,
  PromptTemplate
} from './types';