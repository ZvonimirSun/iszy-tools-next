import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import type { AiChatMessage, AiChatProviderConfig } from '#shared/types/aiChat'
import OpenAI from 'openai'

export interface AiChatRequestModel {
  model: string
  config: AiChatProviderConfig
}

export interface StreamAiChatCompletionOptions {
  model: AiChatRequestModel
  messages: AiChatMessage[]
  signal: AbortSignal
  onDelta: (delta: string) => void
}

export function getAiChatMessageText(message: AiChatMessage) {
  return message.parts.find(part => part.type === 'text')?.text || ''
}

function buildOpenAiMessages(messages: AiChatMessage[]) {
  const requestMessages: ChatCompletionMessageParam[] = []
  for (const message of messages) {
    const content = getAiChatMessageText(message)
    if (!content.trim()) {
      continue
    }
    requestMessages.push({
      role: message.role,
      content,
    })
  }
  return requestMessages
}

function getOpenAiBaseUrl(config: AiChatProviderConfig) {
  const baseUrl = (config.apiBaseUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '')
  if (baseUrl.endsWith('/chat/completions')) {
    return baseUrl.replace(/\/chat\/completions$/, '')
  }
  return baseUrl
}

function createOpenAiClient(config: AiChatProviderConfig) {
  return new OpenAI({
    apiKey: config.apiKey.trim(),
    baseURL: getOpenAiBaseUrl(config),
    dangerouslyAllowBrowser: true,
  })
}

async function streamOpenAiCompatibleCompletion(options: StreamAiChatCompletionOptions) {
  const stream = await createOpenAiClient(options.model.config).chat.completions.create(
    {
      model: options.model.model.trim(),
      messages: buildOpenAiMessages(options.messages),
      stream: true,
    },
    { signal: options.signal },
  )

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) {
      options.onDelta(delta)
    }
  }
}

export async function streamAiChatCompletion(options: StreamAiChatCompletionOptions) {
  switch (options.model.config.type) {
    case 'deepseek':
    case 'openai-compatible':
      await streamOpenAiCompatibleCompletion(options)
  }
}

export function isAiChatRequestAbortError(e: unknown, signal?: AbortSignal) {
  const name = (e as Error).name
  return Boolean(signal?.aborted || name === 'AbortError' || name === 'APIUserAbortError')
}
