<script setup lang="ts">
import type {
  AspectRatioOption,
  CaptureOptions,
  CursorOption,
  FrameRateOption,
  RecorderState,
  ResolutionOption,
} from './children/screenRecord.types'
import { downloadBlob } from '~/utils/common'
import {
  buildDisplayMediaOptions,
} from './children/screenRecord.constraints'
import {
  getErrorMessage,
} from './children/screenRecord.format'
import {
  buildRecordingStream,
  createAudioMixingState,
  disposeAudioContext,
  pickRecorderMimeType,
  stopStream,
} from './children/screenRecord.stream'

const text = {
  unsupported: '当前浏览器不支持屏幕录制，请使用较新的 Chromium 浏览器重试。',
  previewResult: '当前显示为录制结果预览，可清除或下载。',
  previewSharing: '当前显示共享中的实时画面。浏览器原生共享弹窗中的具体选项以浏览器实际支持为准。',
  previewIdle: '默认预览为未获取权限状态，点击“开启共享”后由浏览器弹出原生共享选择窗口。',
  noPermissionTitle: '尚未获取屏幕共享权限',
  noPermissionDesc: '默认预览为灰底，点击下方“开启共享”后由浏览器弹出原生共享窗口。',
  settings: '设置',
  share: '开启共享',
  start: '开始录制',
  pause: '暂停',
  resume: '继续',
  stop: '停止',
  stopShare: '结束共享',
  clear: '清除',
  download: '下载',
  preview: '预览窗',
  currentInfo: '当前信息',
  settingsTitle: '录制设置',
  confirm: '确定',
  defaultOption: '默认',
  always: '总是显示',
  motion: '移动时显示',
  never: '不显示',
  screenSize: '屏幕尺寸',
  systemAudio: '系统音频',
  microphone: '麦克风',
  aspectRatio: '长宽比',
  frameRate: '帧率',
  resolution: '分辨率',
  cursor: '鼠标光标',
  warning: '共享相关设置最终是否生效，以浏览器原生共享弹窗和当前设备能力为准。修改设置后若已在共享中，需要结束共享再重新开启。',
  supportInfo: '浏览器约束支持：长宽比',
  audioPolicy: '音频策略：系统音频通过共享流申请；麦克风通过单独输入流申请。两者同时开启时，会在浏览器端合成为一个录制音频输出。',
  sharedEnded: '屏幕共享已结束',
  sharedStarted: '已开始共享屏幕',
  sharedStartedDesc: '现在可以进行录制操作。',
  recordError: '录制过程中发生错误，请重新开始录制。',
  permissionError: '浏览器未授予屏幕录制权限，请允许屏幕共享或麦克风权限后重试。',
  notFoundError: '未找到可用的共享源或音频输入设备。',
  notReadableError: '录制设备当前不可用，请关闭占用程序后重试。',
  constraintError: '当前设置与浏览器支持的录制能力不匹配，请尝试降低分辨率或帧率。',
  operationFailed: '操作失败：',
  statusShared: '已共享',
  statusNotShared: '未共享',
  statusRecording: '录制中',
  statusPaused: '已暂停',
  statusIdle: '未录制',
  enabled: '开启',
  disabled: '关闭',
  labelShareStatus: '共享状态',
  labelRecordStatus: '录制状态',
  labelSystemAudio: '系统音频',
  labelMicrophone: '麦克风',
  labelFrameRate: '帧率',
  labelResolution: '分辨率',
  labelAspectRatio: '长宽比',
  labelCursor: '鼠标光标',
  labelOutput: '输出格式',
  labelSize: '结果大小',
} as const

const toast = useToast()
const previewVideoEl = ref<HTMLVideoElement | null>(null)
const resultVideoEl = ref<HTMLVideoElement | null>(null)
const isClientReady = ref(false)
const isSupported = ref(false)
const isRequestingShare = ref(false)
const isStoppingRecording = ref(false)
const isEndingShare = ref(false)
const settingsOpen = ref(false)
const errorMessage = ref('')
const recordingState = ref<RecorderState>('idle')
const recordedBlob = shallowRef<Blob | null>(null)
const recordedBlobUrl = ref('')
const recordedMimeType = ref('')
const supportedConstraints = ref<MediaTrackSupportedConstraints>({})
const captureOptions = reactive<CaptureOptions>({
  systemAudio: true,
  microphone: false,
  aspectRatio: 'default',
  frameRate: 'default',
  resolution: 'default',
  cursor: 'default',
})
const aspectRatioOptions: Array<{ label: string, value: AspectRatioOption }> = [
  { label: text.defaultOption, value: 'default' },
  { label: '16:9', value: '16:9' },
  { label: '4:3', value: '4:3' },
  { label: '21:9', value: '21:9' },
  { label: '14:10', value: '14:10' },
  { label: '19:10', value: '19:10' },
]

const frameRateOptions: Array<{ label: string, value: FrameRateOption }> = [
  { label: text.defaultOption, value: 'default' },
  { label: '60 FPS', value: '60' },
  { label: '30 FPS', value: '30' },
  { label: '25 FPS', value: '25' },
  { label: '15 FPS', value: '15' },
  { label: '5 FPS', value: '5' },
]

const resolutionOptions: Array<{ label: string, value: ResolutionOption }> = [
  { label: text.defaultOption, value: 'default' },
  { label: text.screenSize, value: 'fit-screen' },
  { label: '2160p (4K)', value: '2160p' },
  { label: '1440p', value: '1440p' },
  { label: '1080p', value: '1080p' },
  { label: '720p', value: '720p' },
]
const cursorOptions: Array<{ label: string, value: CursorOption }> = [
  { label: text.defaultOption, value: 'default' },
  { label: text.always, value: 'always' },
  { label: text.motion, value: 'motion' },
  { label: text.never, value: 'never' },
]
const displayStream = shallowRef<MediaStream | null>(null)
const microphoneStream = shallowRef<MediaStream | null>(null)
const recordingStream = shallowRef<MediaStream | null>(null)
const mediaRecorder = shallowRef<MediaRecorder | null>(null)
let chunks: Blob[] = []
const audioMixingState = createAudioMixingState()
const hasActiveShare = computed(() => Boolean(displayStream.value && recordingStream.value))
const showRecordedPreview = computed(() => Boolean(recordedBlobUrl.value) && recordingState.value === 'idle')
const statusBadge = computed(() => {
  if (recordingState.value === 'recording') {
    return 'REC'
  }
  if (recordingState.value === 'paused') {
    return 'PAUSE'
  }
  return ''
})
const canStartRecording = computed(() => hasActiveShare.value && recordingState.value === 'idle' && !isStoppingRecording.value)
const canPauseRecording = computed(() => recordingState.value === 'recording' && !isStoppingRecording.value)
const canResumeRecording = computed(() => recordingState.value === 'paused' && !isStoppingRecording.value)
const canStopRecording = computed(() => (recordingState.value === 'recording' || recordingState.value === 'paused') && !isStoppingRecording.value)

function getDownloadFilename() {
  const extension = recordedMimeType.value.includes('mp4') ? 'mp4' : 'webm'
  return `screen-record.${extension}`
}
function revokeRecordedBlobUrl() {
  if (recordedBlobUrl.value) {
    URL.revokeObjectURL(recordedBlobUrl.value)
    recordedBlobUrl.value = ''
  }
}
function clearRecordingResult() {
  recordedBlob.value = null
  recordedMimeType.value = ''
  revokeRecordedBlobUrl()
  if (resultVideoEl.value) {
    resultVideoEl.value.pause()
    resultVideoEl.value.removeAttribute('src')
    resultVideoEl.value.load()
  }
}
async function attachPreviewStream() {
  await nextTick()
  if (!previewVideoEl.value || !displayStream.value || showRecordedPreview.value) {
    return
  }
  if (previewVideoEl.value.srcObject !== displayStream.value) {
    previewVideoEl.value.srcObject = displayStream.value
  }
  previewVideoEl.value.muted = true
  try {
    await previewVideoEl.value.play()
  }
  catch {
    // ignore
  }
}
async function finalizeRecorderStop() {
  isStoppingRecording.value = false
  recordingState.value = 'idle'
  const mimeType = recordedMimeType.value || mediaRecorder.value?.mimeType || pickRecorderMimeType() || 'video/webm'
  if (!chunks.length) {
    mediaRecorder.value = null
    return
  }
  const blob = new Blob(chunks, { type: mimeType })
  chunks = []
  recordedBlob.value = blob
  recordedMimeType.value = mimeType
  revokeRecordedBlobUrl()
  recordedBlobUrl.value = URL.createObjectURL(blob)
  mediaRecorder.value = null
  await nextTick()
  resultVideoEl.value?.load()
}
async function endSharing(notify = true) {
  if (isEndingShare.value) {
    return
  }
  isEndingShare.value = true
  try {
    const currentRecorder = mediaRecorder.value
    if (currentRecorder && currentRecorder.state !== 'inactive') {
      isStoppingRecording.value = true
      currentRecorder.stop()
    }
    else {
      recordingState.value = 'idle'
    }
    const videoTrack = displayStream.value?.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.onended = null
    }
    if (previewVideoEl.value) {
      previewVideoEl.value.pause()
      previewVideoEl.value.srcObject = null
    }
    stopStream(recordingStream.value)
    stopStream(displayStream.value)
    stopStream(microphoneStream.value)
    recordingStream.value = null
    displayStream.value = null
    microphoneStream.value = null
    await disposeAudioContext(audioMixingState)
    if (notify) {
      toast.add({ title: text.sharedEnded, color: 'info' })
    }
  }
  finally {
    isEndingShare.value = false
  }
}
async function handleNativeShareEnded() {
  await endSharing(true)
}
async function startSharing() {
  if (!import.meta.client || !isSupported.value || isRequestingShare.value) {
    return
  }
  errorMessage.value = ''
  isRequestingShare.value = true
  try {
    clearRecordingResult()
    const nextDisplayStream = await navigator.mediaDevices.getDisplayMedia(buildDisplayMediaOptions(captureOptions))
    let nextMicrophoneStream: MediaStream | null = null
    if (captureOptions.microphone) {
      nextMicrophoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
    }
    const nextRecordingStream = await buildRecordingStream(nextDisplayStream, nextMicrophoneStream, audioMixingState)
    const videoTrack = nextDisplayStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.onended = () => {
        void handleNativeShareEnded()
      }
    }
    displayStream.value = nextDisplayStream
    microphoneStream.value = nextMicrophoneStream
    recordingStream.value = nextRecordingStream
    recordingState.value = 'idle'
    await attachPreviewStream()
    toast.add({ title: text.sharedStarted, description: text.sharedStartedDesc, color: 'success' })
  }
  catch (error) {
    errorMessage.value = getErrorMessage(error, text)
    await endSharing(false)
  }
  finally {
    isRequestingShare.value = false
  }
}
function startRecording() {
  if (!recordingStream.value || !canStartRecording.value) {
    return
  }
  errorMessage.value = ''
  clearRecordingResult()
  chunks = []
  const mimeType = pickRecorderMimeType()
  const recorder = mimeType ? new MediaRecorder(recordingStream.value, { mimeType }) : new MediaRecorder(recordingStream.value)
  recordedMimeType.value = mimeType || recorder.mimeType || 'video/webm'
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data)
    }
  }
  recorder.onstop = () => {
    void finalizeRecorderStop()
  }
  recorder.onerror = () => {
    errorMessage.value = text.recordError
    isStoppingRecording.value = false
    recordingState.value = 'idle'
  }
  mediaRecorder.value = recorder
  recorder.start(1000)
  recordingState.value = 'recording'
}
function pauseRecording() {
  if (mediaRecorder.value?.state !== 'recording') {
    return
  }
  mediaRecorder.value.pause()
  recordingState.value = 'paused'
}
function resumeRecording() {
  if (mediaRecorder.value?.state !== 'paused') {
    return
  }
  mediaRecorder.value.resume()
  recordingState.value = 'recording'
}
function stopRecording() {
  if (!mediaRecorder.value || mediaRecorder.value.state === 'inactive' || isStoppingRecording.value) {
    return
  }
  isStoppingRecording.value = true
  mediaRecorder.value.stop()
}
function downloadRecording() {
  if (!recordedBlob.value) {
    return
  }
  downloadBlob(recordedBlob.value, getDownloadFilename())
}
watch([displayStream, showRecordedPreview], async ([stream, shouldShowRecorded]) => {
  if (!stream || shouldShowRecorded) {
    return
  }
  await attachPreviewStream()
})
onMounted(() => {
  isClientReady.value = true
  supportedConstraints.value = navigator.mediaDevices?.getSupportedConstraints?.() ?? {}
  isSupported.value = Boolean(
    typeof navigator.mediaDevices?.getDisplayMedia === 'function'
    && typeof navigator.mediaDevices?.getUserMedia === 'function'
    && typeof MediaRecorder !== 'undefined',
  )
})
onUnmounted(() => {
  void endSharing(false)
  clearRecordingResult()
})
</script>

<template>
  <ClientOnly>
    <div class="h-full overflow-auto flex flex-col gap-4">
      <UAlert
        v-if="!isSupported && isClientReady"
        color="error"
        variant="soft"
        :title="text.unsupported"
        icon="i-lucide:circle-alert"
      />
      <UAlert
        v-else-if="errorMessage"
        color="error"
        variant="soft"
        :title="errorMessage"
        icon="i-lucide:circle-alert"
      />
      <ContainerToolItem :label="text.preview" class="flex-1 overflow-auto" content-class="flex-1 flex flex-col gap-4">
        <div class="relative w-full aspect-video overflow-hidden rounded-lg border border-default bg-muted">
          <video
            v-if="showRecordedPreview"
            ref="resultVideoEl"
            :src="recordedBlobUrl"
            class="h-full w-full bg-muted object-contain"
            controls
            playsinline
          />
          <video
            v-else-if="hasActiveShare"
            ref="previewVideoEl"
            class="h-full w-full bg-muted object-contain"
            autoplay
            playsinline
            muted
          />
          <div v-else class="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <span class="text-base font-medium text-highlighted">{{ text.noPermissionTitle }}</span>
          </div>
          <span v-if="statusBadge" class="absolute left-4 top-4 inline-flex h-8 min-w-[4.75rem] items-center justify-center rounded-full bg-error px-3 text-sm font-bold tracking-[0.08em] text-inverted">{{ statusBadge }}</span>
        </div>
      </ContainerToolItem>
      <div class="flex flex-wrap gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide:settings-2" @click="settingsOpen = true">
          {{ text.settings }}
        </UButton>
        <UButton
          v-if="!hasActiveShare"
          color="primary"
          icon="i-lucide:screen-share"
          :loading="isRequestingShare"
          :disabled="!isSupported"
          @click="startSharing"
        >
          {{ text.share }}
        </UButton>
        <template v-else>
          <UButton color="primary" icon="i-lucide:circle-dot" :disabled="!canStartRecording" @click="startRecording">
            {{ text.start }}
          </UButton>
          <UButton color="warning" variant="outline" icon="i-lucide:pause" :disabled="!canPauseRecording" @click="pauseRecording">
            {{ text.pause }}
          </UButton>
          <UButton color="primary" variant="outline" icon="i-lucide:play" :disabled="!canResumeRecording" @click="resumeRecording">
            {{ text.resume }}
          </UButton>
          <UButton color="error" icon="i-lucide:square" :loading="isStoppingRecording" :disabled="!canStopRecording" @click="stopRecording">
            {{ text.stop }}
          </UButton>
          <UButton color="neutral" variant="outline" icon="i-lucide:monitor-x" @click="endSharing()">
            {{ text.stopShare }}
          </UButton>
        </template>
        <template v-if="recordedBlobUrl">
          <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" @click="clearRecordingResult">
            {{ text.clear }}
          </UButton>
          <UButton color="primary" variant="outline" icon="i-lucide:download" @click="downloadRecording">
            {{ text.download }}
          </UButton>
        </template>
      </div>
      <UModal v-model:open="settingsOpen" :title="text.settingsTitle" :ui="{ content: 'max-w-3xl' }">
        <template #body>
          <div class="flex flex-col gap-4">
            <UAlert color="warning" variant="soft" :title="text.warning" icon="i-lucide:triangle-alert" />
            <div class="grid gap-4 md:grid-cols-2">
              <UFormField :label="text.systemAudio">
                <USwitch v-model="captureOptions.systemAudio" />
              </UFormField>
              <UFormField :label="text.microphone">
                <USwitch v-model="captureOptions.microphone" />
              </UFormField>
              <UFormField :label="text.aspectRatio">
                <USelect v-model="captureOptions.aspectRatio" class="w-full" :items="aspectRatioOptions" />
              </UFormField>
              <UFormField :label="text.frameRate">
                <USelect v-model="captureOptions.frameRate" class="w-full" :items="frameRateOptions" />
              </UFormField>
              <UFormField :label="text.resolution">
                <USelect v-model="captureOptions.resolution" class="w-full" :items="resolutionOptions" />
              </UFormField>
              <UFormField :label="text.cursor">
                <USelect v-model="captureOptions.cursor" class="w-full" :items="cursorOptions" />
              </UFormField>
            </div>
            <div class="rounded-lg border border-default p-4 bg-elevated/40 flex flex-col gap-2 text-sm text-muted">
              <div>
                {{ text.supportInfo }} {{ supportedConstraints.aspectRatio ? 'Y' : 'N' }}，{{ text.frameRate }} {{ supportedConstraints.frameRate ? 'Y' : 'N' }}，{{ text.resolution }} {{ supportedConstraints.width && supportedConstraints.height ? 'Y' : 'N' }}
              </div>
              <div>
                {{ text.audioPolicy }}
              </div>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end w-full">
            <UButton color="primary" @click="settingsOpen = false">
              {{ text.confirm }}
            </UButton>
          </div>
        </template>
      </UModal>
    </div>
    <template #fallback>
      <div class="h-full flex flex-col gap-4">
        <ContainerToolItem :label="text.preview" content-class="flex flex-col gap-4">
          <USkeleton class="h-72 w-full rounded-xl" />
          <USkeleton class="h-4 w-4/5" />
        </ContainerToolItem>
        <div class="flex gap-2">
          <USkeleton class="h-9 w-20 rounded-md" />
          <USkeleton class="h-9 w-28 rounded-md" />
        </div>
      </div>
    </template>
  </ClientOnly>
</template>
