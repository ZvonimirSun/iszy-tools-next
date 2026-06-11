<script setup lang="ts">
import {
  getAiChatMessageText,
  isAiChatRequestAbortError,
  streamAiChatCompletion,
} from './children/aiChatRequests'
import { useAiChatSessionDisplay } from './children/useAiChatSessionDisplay'

type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

const chatStore = useAiChatStore()
const toast = useToast()

const input = ref('')
const status = ref<ChatStatus>('ready')
const error = ref<Error>()
let controller: AbortController | null = null

const sessions = computed(() => chatStore.sortedSessions)
const activeSessionId = computed(() => chatStore.activeSession?.id || '')
const messages = computed(() => chatStore.messages)
const activeModelId = computed(() => chatStore.activeModel?.id || '')
const activeModel = computed(() => chatStore.activeModel)
const configured = computed(() => chatStore.configured)
const modelOptions = computed(() => chatStore.modelOptions)
const { sessionDisplays } = useAiChatSessionDisplay(sessions, activeSessionId)

const chatError = computed(() => {
  return error.value && status.value === 'error' ? error.value : undefined
})

async function submit() {
  const content = input.value.trim()
  if (!content || status.value === 'submitted' || status.value === 'streaming') {
    return
  }

  if (!activeModel.value || !configured.value) {
    toast.add({ title: 'AI 对话未配置', description: '请先在设置中填写当前模型的 API Key 和模型 ID', color: 'warning' })
    return
  }

  error.value = undefined
  input.value = ''
  chatStore.addMessage('user', content)
  const assistantMessage = chatStore.addMessage('assistant', '')
  let answer = ''
  controller = new AbortController()
  status.value = 'submitted'

  try {
    await streamAiChatCompletion({
      model: activeModel.value,
      messages: chatStore.messages,
      signal: controller.signal,
      onDelta: (delta) => {
        if (status.value === 'submitted') {
          status.value = 'streaming'
        }
        answer += delta
        chatStore.updateMessageText(assistantMessage.id, answer)
      },
    })

    if (!answer.trim()) {
      chatStore.updateMessageText(assistantMessage.id, '模型没有返回内容。')
    }
    status.value = 'ready'
  }
  catch (e) {
    if (isAiChatRequestAbortError(e, controller.signal)) {
      status.value = 'ready'
      if (!answer) {
        chatStore.removeMessage(assistantMessage.id)
      }
      return
    }

    error.value = e as Error
    chatStore.removeMessage(assistantMessage.id)
    status.value = 'error'
    toast.add({ title: 'AI 请求失败', description: (e as Error).message, color: 'error' })
  }
  finally {
    controller = null
  }
}

async function reload() {
  if (status.value !== 'error') {
    return
  }
  error.value = undefined
  status.value = 'ready'
  const lastUserMessage = [...chatStore.messages].reverse().find(message => message.role === 'user')
  if (!lastUserMessage) {
    return
  }
  input.value = getAiChatMessageText(lastUserMessage)
  chatStore.removeMessage(lastUserMessage.id)
  await submit()
}

function stop() {
  controller?.abort()
}

function resetStatus() {
  stop()
  error.value = undefined
  status.value = 'ready'
}

function clearMessages() {
  resetStatus()
  chatStore.clearMessages()
}

function createSession() {
  resetStatus()
  chatStore.createSession()
}

function setActiveSession(id: string) {
  resetStatus()
  chatStore.setActiveSession(id)
}

function removeSession(id: string) {
  resetStatus()
  chatStore.removeSession(id)
}
</script>

<template>
  <div class="h-[calc(100dvh-var(--ui-header-height)-2rem)] min-h-0 overflow-hidden">
    <div class="mx-auto grid h-full min-h-0 w-full max-w-7xl grid-cols-1 grid-rows-[16rem_minmax(0,1fr)] gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:grid-rows-1">
      <aside class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-muted bg-elevated/40">
        <div class="flex items-center justify-between gap-2 border-b border-muted p-3">
          <div class="min-w-0">
            <h1 class="truncate text-base font-semibold text-highlighted">
              AI 对话
            </h1>
            <p class="text-xs text-muted">
              本地会话
            </p>
          </div>
          <UButton size="sm" color="primary" variant="soft" icon="i-lucide:plus" @click="createSession">
            新建
          </UButton>
        </div>

        <div v-if="sessionDisplays.length" class="min-h-0 flex-1 overflow-y-auto p-2">
          <div class="flex flex-col gap-1">
            <button
              v-for="display in sessionDisplays"
              :key="display.id"
              type="button"
              class="group rounded-md px-3 py-2 text-left transition-colors"
              :class="display.active ? 'bg-primary/10 text-primary' : 'text-highlighted hover:bg-elevated'"
              @click="setActiveSession(display.id)"
            >
              <span class="flex items-start justify-between gap-2">
                <span class="min-w-0">
                  <span class="block truncate text-sm font-medium">{{ display.title }}</span>
                  <span class="block truncate text-xs text-muted">
                    {{ display.meta }}
                  </span>
                </span>
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide:trash-2"
                  aria-label="删除会话"
                  class="shrink-0 opacity-0 group-hover:opacity-100"
                  @click.stop="removeSession(display.id)"
                />
              </span>
            </button>
          </div>
        </div>

        <div v-else class="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
          <UIcon name="i-lucide:message-square-plus" class="size-8 text-muted" />
          <p class="text-sm text-muted">
            还没有会话
          </p>
        </div>
      </aside>

      <section class="flex min-h-0 flex-col overflow-hidden">
        <div v-if="!messages.length" class="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
          <UIcon name="i-lucide:bot" class="size-12 text-primary" />
          <div class="space-y-2">
            <h2 class="text-3xl font-semibold text-highlighted">
              AI 对话
            </h2>
            <p class="text-muted">
              选择一个模型，然后开始对话。
            </p>
          </div>
        </div>

        <UChatMessages
          v-else
          :messages="messages"
          :status="status"
          should-auto-scroll
          :user="{ side: 'right', variant: 'soft', ui: { content: 'whitespace-pre-wrap' } }"
          :assistant="{ side: 'left', variant: 'naked', ui: { content: 'whitespace-pre-wrap' } }"
          class="min-h-0 flex-1 overflow-y-auto px-1"
        />

        <div class="shrink-0 bg-default/90 backdrop-blur">
          <UAlert
            v-if="!configured"
            color="warning"
            variant="soft"
            title="需要配置当前模型"
            description="在设置中填写当前模型的 API Key 和模型 ID 后即可开始对话。"
            class="mb-3"
          />

          <UChatPrompt
            v-model="input"
            :disabled="!configured"
            :error="chatError"
            :loading="status === 'submitted' || status === 'streaming'"
            placeholder="输入消息"
            class="border border-muted bg-elevated/50"
            :ui="{ body: 'min-h-20 px-4 pt-4 text-base', footer: 'px-4 pb-3 pt-1' }"
            @submit="submit"
          >
            <template #footer>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex min-w-0 items-center gap-2">
                  <USelect
                    :model-value="activeModelId"
                    :items="modelOptions"
                    size="sm"
                    variant="ghost"
                    class="min-w-56"
                    @update:model-value="chatStore.setActiveModel($event as string)"
                  >
                    <template #leading>
                      <UIcon name="i-lucide:brain" class="size-4" />
                    </template>
                  </USelect>
                </div>

                <div class="flex items-center gap-2">
                  <UButton
                    size="sm"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide:trash-2"
                    aria-label="清空当前会话"
                    :disabled="!messages.length"
                    @click="clearMessages"
                  />
                  <ULink to="/settings">
                    <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide:settings-2">
                      设置
                    </UButton>
                  </ULink>
                  <UChatPromptSubmit
                    :status="status"
                    :disabled="!configured"
                    @stop="stop"
                    @reload="reload"
                  />
                </div>
              </div>
            </template>
          </UChatPrompt>
        </div>
      </section>
    </div>
  </div>
</template>
