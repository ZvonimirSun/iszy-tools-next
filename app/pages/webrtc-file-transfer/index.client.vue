<script setup lang="ts">
import { useWebrtcFileTransfer } from './children/useWebrtcFileTransfer'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { copy } = useClipboard()
const {
  role,
  status,
  statusText,
  roomId,
  errorMessage,
  sharedFiles,
  remoteFiles,
  isChannelOpen,
  activeReceivers,
  hasRoom,
  isDownloading,
  activeDownloadFileId,
  addFiles,
  removeSharedFile,
  createRoom,
  joinRoom,
  downloadFile,
  leave,
  reset,
} = useWebrtcFileTransfer()

const activeTab = ref<'send' | 'receive'>('send')
const joinCode = ref('')
const isCreatingRoom = ref(false)
const isJoiningRoom = ref(false)

const tabItems = [
  { label: '发送文件', value: 'send', icon: 'i-lucide-upload' },
  { label: '接收文件', value: 'receive', icon: 'i-lucide-download' },
]

const senderStatusText = computed(() => {
  if (!hasRoom.value) {
    return '未创建房间'
  }
  if (activeReceivers.value > 0) {
    return `${activeReceivers.value} 人已连接`
  }
  return status.value === 'connecting' ? '连接中' : '等待接收方'
})

const receiverStatusText = computed(() => {
  if (!roomId.value) {
    return '未连接'
  }
  if (isDownloading.value) {
    return '正在下载'
  }
  if (isChannelOpen.value) {
    return remoteFiles.value.length ? '已获取文件列表' : '等待文件列表'
  }
  return statusText.value
})

onMounted(() => {
  const queryRoom = typeof route.query.room === 'string' ? route.query.room : ''
  if (queryRoom) {
    joinCode.value = queryRoom.toLowerCase()
    activeTab.value = 'receive'
  }
})

async function handleCreateRoom() {
  try {
    isCreatingRoom.value = true
    await createRoom()
    await router.replace({
      path: route.path,
      query: { room: roomId.value },
    })
  }
  catch (error) {
    showError(error)
  }
  finally {
    isCreatingRoom.value = false
  }
}

async function handleJoinRoom() {
  try {
    isJoiningRoom.value = true
    await joinRoom(joinCode.value)
    await router.replace({
      path: route.path,
      query: { room: roomId.value },
    })
  }
  catch (error) {
    showError(error)
  }
  finally {
    isJoiningRoom.value = false
  }
}

async function handleDownload(fileId: string) {
  try {
    await downloadFile(fileId)
  }
  catch (error) {
    showError(error)
  }
}

async function copyRoomCode() {
  if (!roomId.value) {
    return
  }
  await copy(roomId.value)
  toast.add({
    title: '房间码已复制',
    color: 'success',
    icon: 'i-lucide-copy-check',
  })
}

function handleLeave() {
  leave()
  void router.replace({ path: route.path })
}

function handleReset() {
  reset()
  joinCode.value = ''
  activeTab.value = 'send'
  void router.replace({ path: route.path })
}

function showError(error: unknown) {
  toast.add({
    title: '操作失败',
    description: error instanceof Error ? error.message : String(error),
    color: 'error',
    icon: 'i-lucide-circle-alert',
  })
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 ** 2) {
    return `${(size / 1024).toFixed(2)} KB`
  }
  if (size < 1024 ** 3) {
    return `${(size / 1024 ** 2).toFixed(2)} MB`
  }
  return `${(size / 1024 ** 3).toFixed(2)} GB`
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-4">
    <UTabs v-model="activeTab" :items="tabItems" :content="false" class="w-full" />

    <div v-if="activeTab === 'send'" class="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div class="flex flex-col gap-4">
        <ContainerToolItem label="选择文件" content-class="flex flex-col gap-3">
          <UFileUpload v-slot="{ open }" :model-value="[]" :reset="true" multiple @update:model-value="addFiles">
            <div
              class="flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted bg-muted/30 p-6 text-center transition-colors hover:bg-elevated/50"
              role="button"
              tabindex="0"
              @click="open()"
            >
              <UIcon name="i-lucide-folder-up" class="size-8 text-muted" />
              <div class="text-sm font-medium text-highlighted">
                点击选择文件
              </div>
              <div class="text-xs text-muted">
                可在创建房间前添加，支持一次选择多个文件
              </div>
            </div>
          </UFileUpload>
        </ContainerToolItem>

        <ContainerToolItem label="文件列表" content-class="flex flex-col gap-2">
          <div v-if="sharedFiles.length" class="divide-y divide-muted rounded-lg border border-muted">
            <div
              v-for="file in sharedFiles"
              :key="file.id"
              class="flex items-center justify-between gap-3 p-3"
            >
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-highlighted">
                  {{ file.name }}
                </div>
                <div class="text-xs text-muted">
                  {{ formatFileSize(file.size) }}
                </div>
              </div>
              <UTooltip text="移除">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-x"
                  aria-label="移除文件"
                  @click="removeSharedFile(file.id)"
                />
              </UTooltip>
            </div>
          </div>
          <div v-else class="rounded-lg border border-dashed border-muted p-8 text-center text-sm text-muted">
            暂未选择文件
          </div>
        </ContainerToolItem>
      </div>

      <ContainerToolItem label="房间" content-class="flex flex-col gap-3">
        <UButton
          color="primary"
          icon="i-lucide-radio"
          :loading="isCreatingRoom"
          :disabled="hasRoom"
          block
          @click="handleCreateRoom"
        >
          创建房间
        </UButton>

        <div v-if="roomId" class="grid gap-2">
          <div class="rounded-lg border border-muted bg-muted/30 p-3">
            <div class="text-xs text-muted">
              房间码
            </div>
            <div class="mt-1 flex items-center justify-between gap-2">
              <span class="font-mono text-2xl font-semibold tracking-normal text-highlighted">{{ roomId }}</span>
              <UTooltip text="复制房间码">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-copy"
                  aria-label="复制房间码"
                  @click="copyRoomCode"
                />
              </UTooltip>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <UBadge :color="activeReceivers ? 'success' : 'warning'" variant="soft">
              {{ senderStatusText }}
            </UBadge>
            <UBadge color="neutral" variant="soft">
              {{ sharedFiles.length }} 个文件
            </UBadge>
          </div>
        </div>

        <UAlert
          v-if="errorMessage && role === 'sender'"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :title="errorMessage"
        />

        <div class="flex gap-2">
          <UButton v-if="roomId" color="neutral" variant="outline" icon="i-lucide-log-out" @click="handleLeave">
            关闭
          </UButton>
          <UButton color="neutral" variant="ghost" icon="i-lucide-rotate-ccw" @click="handleReset">
            重置
          </UButton>
        </div>
      </ContainerToolItem>
    </div>

    <div v-else class="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <ContainerToolItem label="连接房间" content-class="flex flex-col gap-3">
        <UInput
          v-model="joinCode"
          class="w-full font-mono"
          icon="i-lucide-key-round"
          placeholder="输入房间码"
          autocomplete="off"
          :disabled="!!roomId"
          @keyup.enter="handleJoinRoom"
        />
        <UButton
          color="primary"
          icon="i-lucide-log-in"
          :disabled="!joinCode || !!roomId"
          :loading="isJoiningRoom"
          block
          @click="handleJoinRoom"
        >
          连接
        </UButton>

        <div v-if="roomId" class="flex flex-wrap gap-2">
          <UBadge :color="isChannelOpen ? 'success' : 'warning'" variant="soft">
            {{ receiverStatusText }}
          </UBadge>
        </div>

        <UAlert
          v-if="errorMessage && role === 'receiver'"
          color="error"
          variant="soft"
          icon="i-lucide-circle-alert"
          :title="errorMessage"
        />

        <div class="flex gap-2">
          <UButton v-if="roomId" color="neutral" variant="outline" icon="i-lucide-log-out" @click="handleLeave">
            离开
          </UButton>
          <UButton color="neutral" variant="ghost" icon="i-lucide-rotate-ccw" @click="handleReset">
            重置
          </UButton>
        </div>
      </ContainerToolItem>

      <ContainerToolItem label="文件列表" content-class="flex flex-col gap-3">
        <div v-if="remoteFiles.length" class="divide-y divide-muted rounded-lg border border-muted">
          <div
            v-for="file in remoteFiles"
            :key="file.id"
            class="grid gap-3 p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-highlighted">
                  {{ file.name }}
                </div>
                <div class="text-xs text-muted">
                  {{ formatFileSize(file.receivedBytes) }} / {{ formatFileSize(file.size) }}
                </div>
              </div>
              <UButton
                color="primary"
                variant="soft"
                size="sm"
                icon="i-lucide-download"
                :loading="activeDownloadFileId === file.id"
                :disabled="isDownloading && activeDownloadFileId !== file.id"
                @click="handleDownload(file.id)"
              >
                {{ file.status === 'done' ? '重新下载' : '下载' }}
              </UButton>
            </div>
            <UProgress :model-value="file.progress" />
          </div>
        </div>
        <div v-else class="rounded-lg border border-dashed border-muted p-8 text-center text-sm text-muted">
          {{ isChannelOpen ? '等待发送方共享文件' : '连接后显示文件列表' }}
        </div>
      </ContainerToolItem>
    </div>
  </div>
</template>
