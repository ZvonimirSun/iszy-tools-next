export interface AudioMixingState {
  audioContext: AudioContext | null
  audioSourceNodes: MediaStreamAudioSourceNode[]
}

export function createAudioMixingState(): AudioMixingState {
  return {
    audioContext: null,
    audioSourceNodes: [],
  }
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach(track => track.stop())
}

export async function disposeAudioContext(state: AudioMixingState) {
  state.audioSourceNodes.forEach(node => node.disconnect())
  state.audioSourceNodes = []
  if (state.audioContext && state.audioContext.state !== 'closed') {
    try {
      await state.audioContext.close()
    }
    catch {
      // ignore
    }
  }
  state.audioContext = null
}

export async function buildRecordingStream(
  sourceDisplayStream: MediaStream,
  sourceMicrophoneStream: MediaStream | null,
  state: AudioMixingState,
) {
  const stream = new MediaStream()
  sourceDisplayStream.getVideoTracks().forEach(track => stream.addTrack(track))

  const availableAudioStreams = [sourceDisplayStream, sourceMicrophoneStream]
    .filter((item): item is MediaStream => Boolean(item && item.getAudioTracks().length > 0))

  if (availableAudioStreams.length === 1) {
    availableAudioStreams[0]?.getAudioTracks().forEach(track => stream.addTrack(track))
    return stream
  }

  if (availableAudioStreams.length > 1) {
    const win = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    const AudioContextCtor = win.AudioContext || win.webkitAudioContext
    if (AudioContextCtor) {
      state.audioContext = new AudioContextCtor()
      const destination = state.audioContext.createMediaStreamDestination()
      if (state.audioContext.state === 'suspended') {
        await state.audioContext.resume().catch(() => undefined)
      }
      for (const sourceStream of availableAudioStreams) {
        const audioOnlyStream = new MediaStream(sourceStream.getAudioTracks())
        const sourceNode = state.audioContext.createMediaStreamSource(audioOnlyStream)
        sourceNode.connect(destination)
        state.audioSourceNodes.push(sourceNode)
      }
      destination.stream.getAudioTracks().forEach(track => stream.addTrack(track))
      return stream
    }

    availableAudioStreams
      .flatMap(item => item.getAudioTracks())
      .forEach(track => stream.addTrack(track))
  }

  return stream
}

export function pickRecorderMimeType() {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return ''
  }

  const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
  return mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || ''
}
