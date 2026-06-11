import type { Ref } from 'vue'
import type { AiChatSession } from '#shared/types/aiChat'

export interface AiChatSessionDisplay {
  id: string
  title: string
  meta: string
  messageCount: number
  updatedAtText: string
  active: boolean
  session: AiChatSession
}

export function useAiChatSessionDisplay(sessions: Ref<AiChatSession[]>, activeSessionId: Ref<string>) {
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  function formatUpdatedAt(value: string) {
    return dateFormatter.format(new Date(value))
  }

  const sessionDisplays = computed<AiChatSessionDisplay[]>(() => {
    return sessions.value.map((session) => {
      const messageCount = session.messages.length
      const updatedAtText = formatUpdatedAt(session.updatedAt)
      return {
        id: session.id,
        title: session.title || '新对话',
        meta: `${messageCount} 条消息 · ${updatedAtText}`,
        messageCount,
        updatedAtText,
        active: session.id === activeSessionId.value,
        session,
      }
    })
  })

  return {
    sessionDisplays,
  }
}
