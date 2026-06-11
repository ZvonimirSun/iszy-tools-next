import type {
  AspectRatioOption,
  CaptureOptions,
  FrameRateOption,
  ResolutionOption,
  ScreenVideoConstraints,
} from './screenRecord.types'

export function getResolutionDimensions(option: ResolutionOption) {
  switch (option) {
    case 'fit-screen':
      if (typeof window === 'undefined') {
        return null
      }
      return { width: window.screen.width, height: window.screen.height }
    case '2160p':
      return { width: 3840, height: 2160 }
    case '1440p':
      return { width: 2560, height: 1440 }
    case '1080p':
      return { width: 1920, height: 1080 }
    case '720p':
      return { width: 1280, height: 720 }
    default:
      return null
  }
}

export function getAspectRatioValue(option: AspectRatioOption) {
  switch (option) {
    case '16:9':
      return 16 / 9
    case '4:3':
      return 4 / 3
    case '21:9':
      return 21 / 9
    case '14:10':
      return 14 / 10
    case '19:10':
      return 19 / 10
    default:
      return undefined
  }
}

export function getFrameRateValue(option: FrameRateOption) {
  switch (option) {
    case '60':
      return 60
    case '30':
      return 30
    case '25':
      return 25
    case '15':
      return 15
    case '5':
      return 5
    default:
      return undefined
  }
}

export function buildDisplayMediaOptions(captureOptions: CaptureOptions): DisplayMediaStreamOptions {
  const video: ScreenVideoConstraints = {}
  const aspectRatioValue = getAspectRatioValue(captureOptions.aspectRatio)
  if (aspectRatioValue) {
    video.aspectRatio = { ideal: aspectRatioValue }
  }

  const frameRateValue = getFrameRateValue(captureOptions.frameRate)
  if (frameRateValue) {
    video.frameRate = { ideal: frameRateValue }
  }

  if (captureOptions.cursor !== 'default') {
    video.cursor = captureOptions.cursor
  }

  const resolution = getResolutionDimensions(captureOptions.resolution)
  if (resolution) {
    video.width = { ideal: resolution.width }
    video.height = { ideal: resolution.height }
  }

  return { video, audio: captureOptions.systemAudio }
}
