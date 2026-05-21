import type {
  AiChatMessage,
  AiChatModel,
  AiChatProviderConfig,
  AiChatProviderType,
  AiChatRole,
  AiChatSession,
} from '#shared/types/aiChat'
import { nanoid } from 'nanoid'
import {
  aiChatProviderTypeOptions,
  deepseekApiBaseUrl,
  getAiChatProviderTypeLabel,
} from '#shared/data/aiChat'

export interface AiChatResolvedModel {
  id: string
  name: string
  model: string
  config: AiChatProviderConfig
}

export const useAiChatStore = defineStore('aiChat', () => {
  const sessions = ref<AiChatSession[]>([])
  const activeSessionId = ref('')
  const settings = computed(() => useSettingsStore().modules.aiChat)
  const configs = computed(() => settings.value.configs)

  const enabledModels = computed<AiChatResolvedModel[]>(() => {
    return configs.value.flatMap((config) => {
      if (!config.enabled || !isConfigReady(config)) {
        return []
      }
      return config.models.filter(model => model.enabled).map(model => ({
        id: model.id,
        name: model.name || model.model,
        model: model.model,
        config,
      }))
    })
  })

  const activeSession = computed(() => {
    return sessions.value.find(session => session.id === activeSessionId.value) || sessions.value[0] || null
  })

  const messages = computed(() => activeSession.value?.messages || [])

  const activeModelId = computed({
    get: () => activeSession.value?.modelId || enabledModels.value[0]?.id || '',
    set: (value: string) => {
      const session = ensureActiveSession()
      session.modelId = value
      touchSession(session)
    },
  })

  const activeModel = computed(() => {
    return enabledModels.value.find(item => item.id === activeModelId.value) || enabledModels.value[0] || null
  })

  const configured = computed(() => {
    const model = activeModel.value
    if (!model) {
      return false
    }
    if (!model.config.enabled) {
      return false
    }
    if (!model.config.apiKey.trim() || !model.model.trim()) {
      return false
    }
    if (model.config.type === 'openai-compatible' && !model.config.apiBaseUrl.trim()) {
      return false
    }
    return true
  })

  const modelOptions = computed(() => {
    return enabledModels.value.map(item => ({
      label: item.name,
      value: item.id,
    }))
  })

  const sortedSessions = computed(() => {
    return [...sessions.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  })

  function createMessage(role: AiChatRole, text = ''): AiChatMessage {
    return {
      id: nanoid(),
      role,
      parts: [{
        type: 'text',
        text,
      }],
      createdAt: new Date().toISOString(),
    }
  }

  function createSession(options: {
    title?: string
    modelId?: string
  } = {}) {
    const now = new Date().toISOString()
    const session: AiChatSession = {
      id: nanoid(),
      title: options.title || '新对话',
      modelId: options.modelId || activeModel.value?.id || enabledModels.value[0]?.id || '',
      messages: [],
      createdAt: now,
      updatedAt: now,
    }
    sessions.value.unshift(session)
    activeSessionId.value = session.id
    return session
  }

  function ensureActiveSession() {
    if (activeSession.value) {
      return activeSession.value
    }
    return createSession()
  }

  function touchSession(session: AiChatSession) {
    session.updatedAt = new Date().toISOString()
  }

  function addMessage(role: AiChatRole, text = '') {
    const session = ensureActiveSession()
    const message = createMessage(role, text)
    session.messages.push(message)
    if (role === 'user' && session.title === '新对话') {
      session.title = text.trim().slice(0, 24) || session.title
    }
    touchSession(session)
    return message
  }

  function updateMessageText(id: string, text: string) {
    const session = activeSession.value
    const message = session?.messages.find(item => item.id === id)
    if (!session || !message) {
      return
    }
    message.parts = [{
      type: 'text',
      text,
    }]
    touchSession(session)
  }

  function removeMessage(id: string) {
    const session = activeSession.value
    if (!session) {
      return
    }
    session.messages = session.messages.filter(item => item.id !== id)
    touchSession(session)
  }

  function clearMessages() {
    const session = activeSession.value
    if (!session) {
      return
    }
    session.messages = []
    session.title = '新对话'
    touchSession(session)
  }

  function removeSession(id: string) {
    const index = sessions.value.findIndex(session => session.id === id)
    if (index < 0) {
      return
    }
    sessions.value.splice(index, 1)
    if (activeSessionId.value === id) {
      activeSessionId.value = sortedSessions.value[0]?.id || ''
    }
  }

  function setActiveSession(id: string) {
    activeSessionId.value = id
  }

  function createModel(type: AiChatProviderType): AiChatModel {
    const model = type === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini'
    const name = type === 'deepseek' ? 'DeepSeek Chat' : 'GPT-4o mini'
    return {
      id: nanoid(),
      name,
      model,
      enabled: true,
    }
  }

  function createConfigDraft(type: AiChatProviderType = 'openai-compatible'): AiChatProviderConfig {
    return {
      id: nanoid(),
      name: getAiChatProviderTypeLabel(type),
      type,
      enabled: false,
      apiBaseUrl: type === 'deepseek' ? deepseekApiBaseUrl : 'https://api.openai.com/v1',
      apiKey: '',
      models: [createModel(type)],
    }
  }

  function addConfig(config: AiChatProviderConfig) {
    const nextConfig = {
      ...config,
      id: nanoid(),
      enabled: false,
      apiBaseUrl: config.type === 'deepseek' ? deepseekApiBaseUrl : config.apiBaseUrl,
      models: config.models.map(model => ({
        ...model,
        id: nanoid(),
      })),
    }
    configs.value.push(nextConfig)
    return nextConfig
  }

  function removeConfig(id: string) {
    if (configs.value.length <= 1) {
      return false
    }
    const removeModelIds = new Set(configs.value.find(item => item.id === id)?.models.map(model => model.id) || [])
    settings.value.configs = configs.value.filter(item => item.id !== id)
    for (const session of sessions.value) {
      if (removeModelIds.has(session.modelId)) {
        session.modelId = enabledModels.value[0]?.id || ''
        touchSession(session)
      }
    }
    return true
  }

  function setConfigType(config: AiChatProviderConfig, type: AiChatProviderType) {
    const oldModelIds = new Set(config.models.map(model => model.id))
    config.type = type
    config.name = getAiChatProviderTypeLabel(type)
    config.enabled = false
    config.apiBaseUrl = type === 'deepseek' ? deepseekApiBaseUrl : 'https://api.openai.com/v1'
    config.models = [createModel(type)]
    for (const session of sessions.value) {
      if (oldModelIds.has(session.modelId)) {
        session.modelId = ''
        touchSession(session)
      }
    }
  }

  function addModel(config: AiChatProviderConfig) {
    const model = createModel(config.type)
    config.models.push(model)
  }

  function removeModel(config: AiChatProviderConfig, id: string) {
    if (config.models.length <= 1) {
      return false
    }
    config.models = config.models.filter(model => model.id !== id)
    for (const session of sessions.value) {
      if (session.modelId === id) {
        session.modelId = enabledModels.value[0]?.id || ''
        touchSession(session)
      }
    }
    return true
  }

  function setActiveModel(id: string) {
    activeModelId.value = id
  }

  function setModelEnabled(model: AiChatModel, enabled: boolean) {
    model.enabled = enabled
    if (!enabled) {
      for (const session of sessions.value) {
        if (session.modelId === model.id) {
          session.modelId = enabledModels.value[0]?.id || ''
          touchSession(session)
        }
      }
    }
  }

  function isConfigReady(config: AiChatProviderConfig) {
    if (!config.apiKey.trim()) {
      return false
    }
    if (config.type === 'openai-compatible' && !config.apiBaseUrl.trim()) {
      return false
    }
    return config.models.some(model => model.enabled && model.model.trim())
  }

  function setConfigEnabled(config: AiChatProviderConfig, enabled: boolean) {
    config.enabled = enabled && isConfigReady(config)
    if (!config.enabled) {
      const modelIds = new Set(config.models.map(model => model.id))
      for (const session of sessions.value) {
        if (modelIds.has(session.modelId)) {
          session.modelId = enabledModels.value[0]?.id || ''
          touchSession(session)
        }
      }
    }
  }

  watch(configs, (items) => {
    for (const config of items) {
      if (config.enabled && !isConfigReady(config)) {
        setConfigEnabled(config, false)
      }
    }
  }, { deep: true })

  return {
    sessions,
    sortedSessions,
    activeSessionId,
    activeSession,
    messages,
    settings,
    configs,
    enabledModels,
    activeModelId,
    activeModel,
    configured,
    modelOptions,
    providerTypeOptions: aiChatProviderTypeOptions,
    addMessage,
    updateMessageText,
    removeMessage,
    clearMessages,
    createSession,
    removeSession,
    setActiveSession,
    createConfigDraft,
    addConfig,
    removeConfig,
    setConfigType,
    addModel,
    removeModel,
    setActiveModel,
    setConfigEnabled,
    setModelEnabled,
    isConfigReady,
    getAiChatProviderTypeLabel,
  }
}, {
  persist: [
    {
      storage: piniaPluginPersistedstate.indexedDBStorage(),
      pick: ['sessions', 'activeSessionId'],
    },
  ],
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAiChatStore, import.meta.hot))
}
