export type AiChatProviderType = 'deepseek' | 'openai-compatible'

export interface AiChatModel {
  id: string
  name: string
  model: string
  enabled: boolean
}

export interface AiChatProviderConfig {
  id: string
  name: string
  type: AiChatProviderType
  enabled: boolean
  apiBaseUrl: string
  apiKey: string
  models: AiChatModel[]
}

export interface AiChatSettings {
  configs: AiChatProviderConfig[]
}

export type AiChatRole = 'user' | 'assistant'

export interface AiChatMessage {
  id: string
  role: AiChatRole
  parts: {
    type: 'text'
    text: string
  }[]
  createdAt: string
}

export interface AiChatSession {
  id: string
  title: string
  modelId: string
  messages: AiChatMessage[]
  createdAt: string
  updatedAt: string
}
