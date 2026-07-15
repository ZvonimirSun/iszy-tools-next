export type WebrtcFileRole = 'idle' | 'sender' | 'receiver'

export type WebrtcFileStatus
  = | 'idle'
    | 'waiting'
    | 'connecting'
    | 'connected'
    | 'transferring'
    | 'closed'
    | 'error'

export type RemoteFileStatus = 'idle' | 'downloading' | 'done' | 'error'

export interface SharedFileItem {
  id: string
  name: string
  size: number
  type: string
  lastModified: number
  file: File
}

export interface RemoteFileItem {
  id: string
  name: string
  size: number
  type: string
  lastModified: number
  receivedBytes: number
  progress: number
  status: RemoteFileStatus
  url?: string
}

export interface IceServersData {
  ttl: number
  expiresAt: number
  iceServers: RTCIceServer[]
}

export interface WebrtcFileSession extends IceServersData {
  uid: string
  peerId: string
  role: 'offer'
}

export interface WebrtcFileSignalEnvelope {
  uid?: string
  peer_id?: string
  peerId?: string
  role?: 'offer' | 'answer' | 'server'
  type?: string
  offer?: string
  message?: string
  active_receivers?: number
  total_receivers?: number
  ttl?: number
  expiresAt?: number
  iceServers?: RTCIceServer[]
}

export interface WebrtcFileSignalPayload {
  type: 'offer' | 'answer' | 'candidate'
  peerId?: string
  data: RTCSessionDescriptionInit | RTCIceCandidateInit | null
}

export interface FileListChannelMessage {
  kind: 'file-list'
  files: Array<Omit<SharedFileItem, 'file'>>
}

export interface DownloadRequestChannelMessage {
  kind: 'download-request'
  fileId: string
  requestId: string
}

export interface FileMetaChannelMessage {
  kind: 'file-meta'
  fileId: string
  requestId: string
  name: string
  size: number
  type: string
  lastModified: number
}

export interface FileDoneChannelMessage {
  kind: 'file-done'
  fileId: string
  requestId: string
}

export interface FileErrorChannelMessage {
  kind: 'error'
  message: string
  fileId?: string
  requestId?: string
}

export type WebrtcFileChannelMessage
  = | FileListChannelMessage
    | DownloadRequestChannelMessage
    | FileMetaChannelMessage
    | FileDoneChannelMessage
    | FileErrorChannelMessage
