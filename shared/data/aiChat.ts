import type { AiChatProviderConfig, AiChatProviderType, AiChatSettings } from '#shared/types/aiChat'

export const deepseekApiBaseUrl = 'https://api.deepseek.com/v1'

export const aiChatProviderTypeOptions: {
  label: string
  value: AiChatProviderType
}[] = [
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'OpenAI 兼容', value: 'openai-compatible' },
]

export function getAiChatProviderTypeLabel(type: AiChatProviderType) {
  return aiChatProviderTypeOptions.find(item => item.value === type)?.label ?? type
}

export const defaultAiChatConfigs: AiChatProviderConfig[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    type: 'deepseek',
    enabled: false,
    apiBaseUrl: deepseekApiBaseUrl,
    apiKey: '',
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        model: 'deepseek-chat',
        enabled: true,
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        model: 'deepseek-reasoner',
        enabled: true,
      },
    ],
  },
  {
    id: 'openai-compatible',
    name: 'OpenAI 兼容',
    type: 'openai-compatible',
    enabled: false,
    apiBaseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    models: [
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o mini',
        model: 'gpt-4o-mini',
        enabled: true,
      },
    ],
  },
]

export function createDefaultAiChatSettings(): AiChatSettings {
  return {
    configs: defaultAiChatConfigs.map(config => ({
      ...config,
      models: config.models.map(model => ({ ...model })),
    })),
  }
}
