export interface MediaTrackSettingsWithCursor extends MediaTrackSettings {
  cursor?: string
}

export type RecorderState = 'idle' | 'recording' | 'paused'
export type AspectRatioOption = 'default' | '16:9' | '4:3' | '21:9' | '14:10' | '19:10'
export type FrameRateOption = 'default' | '60' | '30' | '25' | '15' | '5'
export type ResolutionOption = 'default' | 'fit-screen' | '2160p' | '1440p' | '1080p' | '720p'
export type CursorOption = 'default' | 'always' | 'motion' | 'never'

export interface ScreenVideoConstraints extends MediaTrackConstraints {
  cursor?: CursorOption
}

export interface CaptureOptions {
  systemAudio: boolean
  microphone: boolean
  aspectRatio: AspectRatioOption
  frameRate: FrameRateOption
  resolution: ResolutionOption
  cursor: CursorOption
}
