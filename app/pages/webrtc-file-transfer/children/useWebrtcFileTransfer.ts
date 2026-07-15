import type { ResultDto } from '@zvonimirsun/iszy-common'
import type {
  DownloadRequestChannelMessage,
  FileDoneChannelMessage,
  FileErrorChannelMessage,
  FileListChannelMessage,
  FileMetaChannelMessage,
  RemoteFileItem,
  SharedFileItem,
  WebrtcFileChannelMessage,
  WebrtcFileRole,
  WebrtcFileSession,
  WebrtcFileSignalEnvelope,
  WebrtcFileSignalPayload,
  WebrtcFileStatus,
} from './webrtcFileTransfer.types'

const CHUNK_SIZE = 64 * 1024
const BUFFERED_AMOUNT_HIGH = 4 * 1024 * 1024
const BUFFERED_AMOUNT_LOW = 512 * 1024

interface SenderPeer {
  peerId: string
  pc: RTCPeerConnection
  channel: RTCDataChannel
  activeFileId?: string
}

interface IncomingDownload {
  fileId: string
  requestId: string
  chunks: ArrayBuffer[]
}

export function useWebrtcFileTransfer() {
  const { apiOrigin } = usePublicConfig()
  const role = ref<WebrtcFileRole>('idle')
  const status = ref<WebrtcFileStatus>('idle')
  const roomId = ref('')
  const peerId = ref('')
  const errorMessage = ref('')
  const sharedFiles = ref<SharedFileItem[]>([])
  const remoteFiles = ref<RemoteFileItem[]>([])
  const isChannelOpen = ref(false)
  const activeReceivers = ref(0)
  const totalReceivers = ref(0)
  const activeDownloadFileId = ref('')

  let ws: WebSocket | undefined
  let receiverPc: RTCPeerConnection | undefined
  let receiverChannel: RTCDataChannel | undefined
  let senderIceServers: RTCIceServer[] = []
  let receiverIceServers: RTCIceServer[] = []
  let pendingReceiverCandidates: RTCIceCandidateInit[] = []
  let incomingDownload: IncomingDownload | undefined
  const senderPeers = new Map<string, SenderPeer>()
  const pendingSenderCandidates = new Map<string, RTCIceCandidateInit[]>()

  const statusText = computed(() => {
    const map: Record<WebrtcFileStatus, string> = {
      idle: '待开始',
      waiting: '等待连接',
      connecting: '连接中',
      connected: '已连接',
      transferring: '传输中',
      closed: '已关闭',
      error: '连接异常',
    }
    return map[status.value]
  })

  const hasRoom = computed(() => !!roomId.value)
  const isDownloading = computed(() => !!activeDownloadFileId.value)

  function addFiles(files: File | File[] | FileList | null | undefined) {
    const nextFiles = normalizeFiles(files)
    if (!nextFiles.length) {
      return
    }

    const existingKeys = new Set(sharedFiles.value.map(file => getFileKey(file)))
    const additions = nextFiles
      .filter(file => !existingKeys.has(getFileKey(file)))
      .map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        lastModified: file.lastModified,
        file,
      } satisfies SharedFileItem))

    if (!additions.length) {
      return
    }

    sharedFiles.value = [...sharedFiles.value, ...additions]
    broadcastFileList()
  }

  function removeSharedFile(fileId: string) {
    sharedFiles.value = sharedFiles.value.filter(file => file.id !== fileId)
    broadcastFileList()
  }

  async function createRoom() {
    closeConnection()
    clearReceiverFiles()
    role.value = 'sender'
    status.value = 'waiting'
    errorMessage.value = ''

    const res = await $fetch<ResultDto<WebrtcFileSession>>(`${apiOrigin}/rtc/file-transfer/sessions`, {
      method: 'POST',
    })
    const session = res.data
    if (!session) {
      throw new Error('创建房间失败')
    }

    roomId.value = session.uid
    peerId.value = session.peerId
    senderIceServers = session.iceServers
    await connectSignaling()
    sendSignal({
      uid: session.uid,
      peer_id: session.peerId,
      role: 'offer',
      type: 'register',
    })
  }

  async function joinRoom(targetRoomId: string) {
    const nextRoomId = targetRoomId.trim().toLowerCase()
    if (!nextRoomId) {
      throw new Error('请输入房间码')
    }

    closeConnection()
    clearReceiverFiles()
    role.value = 'receiver'
    status.value = 'connecting'
    roomId.value = nextRoomId
    errorMessage.value = ''

    await connectSignaling()
    sendSignal({
      uid: roomId.value,
      role: 'answer',
      type: 'join',
    })
  }

  async function downloadFile(fileId: string) {
    const file = remoteFiles.value.find(item => item.id === fileId)
    if (!file || !receiverChannel || receiverChannel.readyState !== 'open') {
      return
    }
    if (activeDownloadFileId.value && activeDownloadFileId.value !== fileId) {
      return
    }

    revokeRemoteFileUrl(file)
    file.receivedBytes = 0
    file.progress = 0
    file.status = 'downloading'
    activeDownloadFileId.value = fileId
    incomingDownload = undefined
    status.value = 'transferring'

    sendChannelMessage(receiverChannel, {
      kind: 'download-request',
      fileId,
      requestId: crypto.randomUUID(),
    })
  }

  async function connectSignaling() {
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(getSignalingUrl())
      ws = socket

      socket.onopen = () => resolve()
      socket.onerror = () => {
        status.value = 'error'
        errorMessage.value = '连接服务失败'
        reject(new Error(errorMessage.value))
      }
      socket.onclose = () => {
        if (!['idle', 'closed'].includes(status.value)) {
          status.value = 'closed'
        }
      }
      socket.onmessage = event => void handleSignalMessage(event.data)
    })
  }

  async function handleSignalMessage(rawData: string | ArrayBuffer | Blob) {
    try {
      const envelope = await parseSignalEnvelope(rawData)
      if (envelope.type === 'error') {
        throw new Error(String(envelope.message || '连接服务异常'))
      }
      if (envelope.type === 'joined') {
        await handleJoined(envelope)
        return
      }
      if (envelope.type === 'peer_joined') {
        await handlePeerJoined(envelope)
        return
      }
      if (envelope.type === 'peer-left') {
        handlePeerLeft(envelope)
        return
      }

      const payload = parseSignalPayload(envelope)
      if (!payload) {
        return
      }

      if (role.value === 'sender') {
        await handleSenderSignal(payload)
      }
      else if (role.value === 'receiver' && envelope.role === 'offer') {
        await handleReceiverSignal(payload)
      }
    }
    catch (error) {
      status.value = 'error'
      errorMessage.value = error instanceof Error ? error.message : '连接处理失败'
    }
  }

  async function handleJoined(envelope: WebrtcFileSignalEnvelope) {
    peerId.value = envelope.peer_id || ''
    receiverIceServers = envelope.iceServers || []
    await setupReceiverPeer()
  }

  async function handlePeerJoined(envelope: WebrtcFileSignalEnvelope) {
    const targetPeerId = envelope.peer_id
    if (!targetPeerId) {
      return
    }
    activeReceivers.value = envelope.active_receivers || activeReceivers.value + 1
    totalReceivers.value = envelope.total_receivers || totalReceivers.value + 1
    await createSenderPeer(targetPeerId)
  }

  function handlePeerLeft(envelope: WebrtcFileSignalEnvelope) {
    const leavingPeerId = envelope.peer_id
    if (!leavingPeerId) {
      return
    }
    const peer = senderPeers.get(leavingPeerId)
    peer?.channel.close()
    peer?.pc.close()
    senderPeers.delete(leavingPeerId)
    activeReceivers.value = Math.max(0, activeReceivers.value - 1)
    refreshChannelOpenState()
  }

  async function createSenderPeer(targetPeerId: string) {
    const existingPeer = senderPeers.get(targetPeerId)
    existingPeer?.channel.close()
    existingPeer?.pc.close()

    const pc = new RTCPeerConnection({ iceServers: senderIceServers })
    const channel = pc.createDataChannel('file', { ordered: true })
    const peer: SenderPeer = { peerId: targetPeerId, pc, channel }
    senderPeers.set(targetPeerId, peer)
    bindSenderDataChannel(peer)
    bindSenderPeerConnection(peer)

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendPeerSignal(targetPeerId, {
      type: 'offer',
      data: pc.localDescription,
    })
    status.value = 'connecting'
  }

  function bindSenderPeerConnection(peer: SenderPeer) {
    peer.pc.onicecandidate = (event) => {
      sendPeerSignal(peer.peerId, {
        type: 'candidate',
        data: event.candidate ? event.candidate.toJSON() : null,
      })
    }
    peer.pc.onconnectionstatechange = () => {
      if (peer.pc.connectionState === 'connected') {
        status.value = 'connected'
      }
      else if (['failed', 'disconnected', 'closed'].includes(peer.pc.connectionState)) {
        senderPeers.delete(peer.peerId)
        refreshChannelOpenState()
      }
    }
  }

  function bindSenderDataChannel(peer: SenderPeer) {
    peer.channel.binaryType = 'arraybuffer'
    peer.channel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_LOW
    peer.channel.onopen = () => {
      isChannelOpen.value = true
      status.value = 'connected'
      sendFileList(peer.channel)
    }
    peer.channel.onclose = refreshChannelOpenState
    peer.channel.onerror = () => {
      errorMessage.value = '文件传输连接异常'
    }
    peer.channel.onmessage = event => void handleSenderChannelMessage(peer, event.data)
  }

  async function setupReceiverPeer() {
    receiverPc = new RTCPeerConnection({ iceServers: receiverIceServers })
    receiverPc.ondatachannel = (event) => {
      receiverChannel = event.channel
      bindReceiverDataChannel(receiverChannel)
    }
    receiverPc.onicecandidate = (event) => {
      sendSignal({
        uid: roomId.value,
        role: 'answer',
        offer: JSON.stringify({
          type: 'candidate',
          peerId: peerId.value,
          data: event.candidate ? event.candidate.toJSON() : null,
        } satisfies WebrtcFileSignalPayload),
      })
    }
    receiverPc.onconnectionstatechange = () => {
      if (!receiverPc) {
        return
      }
      if (receiverPc.connectionState === 'connected') {
        status.value = activeDownloadFileId.value ? 'transferring' : 'connected'
      }
      else if (['failed', 'disconnected'].includes(receiverPc.connectionState)) {
        status.value = 'error'
      }
      else if (receiverPc.connectionState === 'closed') {
        status.value = 'closed'
      }
    }
  }

  function bindReceiverDataChannel(nextChannel: RTCDataChannel) {
    nextChannel.binaryType = 'arraybuffer'
    nextChannel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_LOW
    nextChannel.onopen = () => {
      isChannelOpen.value = true
      status.value = 'connected'
    }
    nextChannel.onclose = () => {
      isChannelOpen.value = false
      if (status.value !== 'idle') {
        status.value = 'closed'
      }
    }
    nextChannel.onerror = () => {
      status.value = 'error'
      errorMessage.value = '文件传输连接异常'
    }
    nextChannel.onmessage = event => void handleReceiverChannelMessage(event.data)
  }

  async function handleSenderSignal(payload: WebrtcFileSignalPayload) {
    const sourcePeerId = payload.peerId
    if (!sourcePeerId) {
      return
    }
    const peer = senderPeers.get(sourcePeerId)
    if (!peer) {
      return
    }

    if (payload.type === 'answer') {
      if (!peer.pc.currentRemoteDescription) {
        await peer.pc.setRemoteDescription(payload.data as RTCSessionDescriptionInit)
        await flushSenderCandidates(sourcePeerId)
      }
    }
    else if (payload.type === 'candidate' && payload.data) {
      const candidate = payload.data as RTCIceCandidateInit
      if (peer.pc.remoteDescription) {
        await peer.pc.addIceCandidate(candidate)
      }
      else {
        const candidates = pendingSenderCandidates.get(sourcePeerId) || []
        candidates.push(candidate)
        pendingSenderCandidates.set(sourcePeerId, candidates)
      }
    }
  }

  async function handleReceiverSignal(payload: WebrtcFileSignalPayload) {
    if (!receiverPc) {
      await setupReceiverPeer()
    }
    if (!receiverPc) {
      return
    }

    if (payload.type === 'offer') {
      await receiverPc.setRemoteDescription(payload.data as RTCSessionDescriptionInit)
      await flushReceiverCandidates()
      const answer = await receiverPc.createAnswer()
      await receiverPc.setLocalDescription(answer)
      sendSignal({
        uid: roomId.value,
        role: 'answer',
        offer: JSON.stringify({
          type: 'answer',
          peerId: peerId.value,
          data: receiverPc.localDescription,
        } satisfies WebrtcFileSignalPayload),
      })
      status.value = 'connecting'
    }
    else if (payload.type === 'candidate' && payload.data) {
      const candidate = payload.data as RTCIceCandidateInit
      if (receiverPc.remoteDescription) {
        await receiverPc.addIceCandidate(candidate)
      }
      else {
        pendingReceiverCandidates.push(candidate)
      }
    }
  }

  async function flushSenderCandidates(targetPeerId: string) {
    const peer = senderPeers.get(targetPeerId)
    if (!peer?.pc.remoteDescription) {
      return
    }
    for (const candidate of pendingSenderCandidates.get(targetPeerId) || []) {
      await peer.pc.addIceCandidate(candidate)
    }
    pendingSenderCandidates.delete(targetPeerId)
  }

  async function flushReceiverCandidates() {
    if (!receiverPc?.remoteDescription) {
      return
    }
    for (const candidate of pendingReceiverCandidates) {
      await receiverPc.addIceCandidate(candidate)
    }
    pendingReceiverCandidates = []
  }

  async function handleSenderChannelMessage(peer: SenderPeer, data: string | ArrayBuffer | Blob) {
    if (typeof data !== 'string') {
      return
    }
    const message = JSON.parse(data) as WebrtcFileChannelMessage
    if (message.kind !== 'download-request') {
      return
    }

    const file = sharedFiles.value.find(item => item.id === message.fileId)
    if (!file) {
      sendChannelMessage(peer.channel, {
        kind: 'error',
        fileId: message.fileId,
        requestId: message.requestId,
        message: '文件不存在或已移除',
      })
      return
    }

    try {
      peer.activeFileId = file.id
      status.value = 'transferring'
      await sendFileToPeer(peer, file, message)
    }
    catch (error) {
      sendChannelMessage(peer.channel, {
        kind: 'error',
        fileId: message.fileId,
        requestId: message.requestId,
        message: error instanceof Error ? error.message : '文件发送失败',
      })
    }
    finally {
      peer.activeFileId = undefined
      if ([...senderPeers.values()].some(item => item.activeFileId)) {
        status.value = 'transferring'
      }
      else if (isChannelOpen.value) {
        status.value = 'connected'
      }
    }
  }

  async function sendFileToPeer(peer: SenderPeer, item: SharedFileItem, request: DownloadRequestChannelMessage) {
    sendChannelMessage(peer.channel, {
      kind: 'file-meta',
      fileId: item.id,
      requestId: request.requestId,
      name: item.name,
      size: item.size,
      type: item.type,
      lastModified: item.lastModified,
    })

    for (let offset = 0; offset < item.file.size; offset += CHUNK_SIZE) {
      await waitForBufferedAmount(peer.channel)
      const end = Math.min(offset + CHUNK_SIZE, item.file.size)
      peer.channel.send(await item.file.slice(offset, end).arrayBuffer())
    }

    sendChannelMessage(peer.channel, {
      kind: 'file-done',
      fileId: item.id,
      requestId: request.requestId,
    })
  }

  async function handleReceiverChannelMessage(data: string | ArrayBuffer | Blob) {
    if (typeof data === 'string') {
      const message = JSON.parse(data) as WebrtcFileChannelMessage
      if (message.kind === 'file-list') {
        syncRemoteFiles(message)
      }
      else if (message.kind === 'file-meta') {
        startIncomingDownload(message)
      }
      else if (message.kind === 'file-done') {
        finishIncomingDownload(message)
      }
      else if (message.kind === 'error') {
        failIncomingDownload(message)
      }
      return
    }

    const chunk = data instanceof Blob ? await data.arrayBuffer() : data
    if (!incomingDownload) {
      return
    }
    incomingDownload.chunks.push(chunk)
    const file = remoteFiles.value.find(item => item.id === incomingDownload?.fileId)
    if (file) {
      file.receivedBytes += chunk.byteLength
      file.progress = file.size ? Math.min(100, Math.round((file.receivedBytes / file.size) * 100)) : 100
    }
  }

  function syncRemoteFiles(message: FileListChannelMessage) {
    const currentFiles = new Map(remoteFiles.value.map(file => [file.id, file]))
    remoteFiles.value = message.files.map((file) => {
      const current = currentFiles.get(file.id)
      return {
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        receivedBytes: current?.receivedBytes || 0,
        progress: current?.progress || 0,
        status: current?.status || 'idle',
        url: current?.url,
      }
    })
  }

  function startIncomingDownload(message: FileMetaChannelMessage) {
    const file = remoteFiles.value.find(item => item.id === message.fileId)
    if (!file || activeDownloadFileId.value !== message.fileId) {
      return
    }

    revokeRemoteFileUrl(file)
    file.receivedBytes = 0
    file.progress = 0
    file.status = 'downloading'
    incomingDownload = {
      fileId: message.fileId,
      requestId: message.requestId,
      chunks: [],
    }
  }

  function finishIncomingDownload(message: FileDoneChannelMessage) {
    if (!incomingDownload || incomingDownload.requestId !== message.requestId) {
      return
    }

    const file = remoteFiles.value.find(item => item.id === message.fileId)
    if (file) {
      const blob = new Blob(incomingDownload.chunks, {
        type: file.type || 'application/octet-stream',
      })
      file.url = URL.createObjectURL(blob)
      file.receivedBytes = file.size
      file.progress = 100
      file.status = 'done'
      triggerBrowserDownload(file)
    }

    incomingDownload = undefined
    activeDownloadFileId.value = ''
    status.value = 'connected'
  }

  function failIncomingDownload(message: FileErrorChannelMessage) {
    const file = message.fileId ? remoteFiles.value.find(item => item.id === message.fileId) : undefined
    if (file) {
      file.status = 'error'
    }
    incomingDownload = undefined
    activeDownloadFileId.value = ''
    status.value = 'error'
    errorMessage.value = message.message
  }

  async function waitForBufferedAmount(channel: RTCDataChannel) {
    if (channel.bufferedAmount <= BUFFERED_AMOUNT_HIGH) {
      return
    }
    await new Promise<void>((resolve) => {
      const handler = () => {
        channel.removeEventListener('bufferedamountlow', handler)
        resolve()
      }
      channel.addEventListener('bufferedamountlow', handler)
    })
  }

  function sendFileList(channel: RTCDataChannel) {
    if (channel.readyState !== 'open') {
      return
    }
    sendChannelMessage(channel, {
      kind: 'file-list',
      files: sharedFiles.value.map(({ file: _file, ...item }) => item),
    })
  }

  function broadcastFileList() {
    for (const peer of senderPeers.values()) {
      sendFileList(peer.channel)
    }
  }

  function sendChannelMessage(channel: RTCDataChannel, message: WebrtcFileChannelMessage) {
    if (channel.readyState === 'open') {
      channel.send(JSON.stringify(message))
    }
  }

  function sendPeerSignal(targetPeerId: string, payload: WebrtcFileSignalPayload) {
    sendSignal({
      uid: roomId.value,
      role: 'offer',
      peer_id: targetPeerId,
      offer: JSON.stringify(payload),
    })
  }

  function sendSignal(message: WebrtcFileSignalEnvelope) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  function leave() {
    sendSignal({
      uid: roomId.value,
      peer_id: peerId.value,
      role: role.value === 'sender' ? 'offer' : 'answer',
      type: 'leave',
    })
    closeConnection()
    role.value = 'idle'
    status.value = 'idle'
    roomId.value = ''
    peerId.value = ''
  }

  function reset() {
    closeConnection()
    role.value = 'idle'
    status.value = 'idle'
    roomId.value = ''
    peerId.value = ''
    errorMessage.value = ''
    sharedFiles.value = []
    clearReceiverFiles()
  }

  function closeConnection() {
    ws?.close()
    ws = undefined
    for (const peer of senderPeers.values()) {
      peer.channel.close()
      peer.pc.close()
    }
    senderPeers.clear()
    receiverChannel?.close()
    receiverPc?.close()
    receiverChannel = undefined
    receiverPc = undefined
    senderIceServers = []
    receiverIceServers = []
    pendingReceiverCandidates = []
    pendingSenderCandidates.clear()
    incomingDownload = undefined
    isChannelOpen.value = false
    activeReceivers.value = 0
    totalReceivers.value = 0
    activeDownloadFileId.value = ''
  }

  function clearReceiverFiles() {
    for (const file of remoteFiles.value) {
      revokeRemoteFileUrl(file)
    }
    remoteFiles.value = []
  }

  function revokeRemoteFileUrl(file: RemoteFileItem) {
    if (file.url) {
      URL.revokeObjectURL(file.url)
      file.url = undefined
    }
  }

  function refreshChannelOpenState() {
    isChannelOpen.value = role.value === 'sender'
      ? [...senderPeers.values()].some(peer => peer.channel.readyState === 'open')
      : receiverChannel?.readyState === 'open'
  }

  function triggerBrowserDownload(file: RemoteFileItem) {
    if (!file.url) {
      return
    }
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.click()
  }

  function getSignalingUrl() {
    const origin = apiOrigin || 'https://api.ovooo.cc'
    const url = new URL(origin)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = '/rtc/file-transfer/signaling'
    url.search = ''
    url.hash = ''
    return url.toString()
  }

  async function parseSignalEnvelope(rawData: string | ArrayBuffer | Blob) {
    if (typeof rawData === 'string') {
      return JSON.parse(rawData) as WebrtcFileSignalEnvelope
    }
    if (rawData instanceof Blob) {
      return JSON.parse(await rawData.text()) as WebrtcFileSignalEnvelope
    }
    return JSON.parse(new TextDecoder().decode(rawData)) as WebrtcFileSignalEnvelope
  }

  function parseSignalPayload(envelope: WebrtcFileSignalEnvelope) {
    if (!envelope.offer || typeof envelope.offer !== 'string') {
      return null
    }
    return JSON.parse(envelope.offer) as WebrtcFileSignalPayload
  }

  function normalizeFiles(files: File | File[] | FileList | null | undefined) {
    if (!files) {
      return []
    }
    if (files instanceof File) {
      return [files]
    }
    return Array.from(files)
  }

  function getFileKey(file: Pick<SharedFileItem, 'name' | 'size' | 'lastModified'>) {
    return `${file.name}:${file.size}:${file.lastModified}`
  }

  onBeforeUnmount(() => {
    reset()
  })

  return {
    role,
    status,
    statusText,
    roomId,
    peerId,
    errorMessage,
    sharedFiles,
    remoteFiles,
    isChannelOpen,
    activeReceivers,
    totalReceivers,
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
  }
}
