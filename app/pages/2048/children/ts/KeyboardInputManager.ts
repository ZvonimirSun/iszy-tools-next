import type { Direction, GameView } from '../2048.types'

type InputEventName = 'move' | 'restart' | 'keepPlaying'
type InputCallback = (data: Direction) => void
type TouchLikeEvent = Event & {
  touches: TouchList
  targetTouches: TouchList
  changedTouches: TouchList
}
type PointerLikeEvent = Event & {
  pageX: number
  pageY: number
}

function isTouchLikeEvent(event: Event): event is TouchLikeEvent {
  return 'touches' in event && 'targetTouches' in event && 'changedTouches' in event
}

function isPointerLikeEvent(event: Event): event is PointerLikeEvent {
  return 'pageX' in event && 'pageY' in event
}

export default class KeyboardInputManager {
  events: Partial<Record<InputEventName, InputCallback[]>> = {}
  view: GameView
  map: Record<string, Direction>
  eventTouchstart: 'touchstart' | 'MSPointerDown'
  eventTouchmove: 'touchmove' | 'MSPointerMove'
  eventTouchend: 'touchend' | 'MSPointerUp'
  retryButton: HTMLElement
  restartButton: HTMLElement
  keepPlayingButton: HTMLElement
  gameContainer: HTMLElement
  touchStartClientX = 0
  touchStartClientY = 0
  keyboardHandler = this.keyboardEvent.bind(this)
  retryHandler: EventListener = this.restart.bind(this)
  restartHandler: EventListener = this.restart.bind(this)
  keepPlayingHandler: EventListener = this.keepPlaying.bind(this)
  touchStartHandler: EventListener = this.touchStartEvent.bind(this)
  touchMoveHandler: EventListener = this.touchMoveEvent.bind(this)
  touchEndHandler: EventListener = this.touchEndEvent.bind(this)

  constructor(view: GameView) {
    this.events = {}
    this.view = view

    this.map = {
      ArrowUp: 0, // Up
      ArrowRight: 1, // Right
      ArrowDown: 2, // Down
      ArrowLeft: 3, // Left
      KeyK: 0, // Vim up
      KeyL: 1, // Vim right
      KeyJ: 2, // Vim down
      KeyH: 3, // Vim left
      KeyW: 0, // W
      KeyD: 1, // D
      KeyS: 2, // S
      KeyA: 3, // A
    }

    if ('msPointerEnabled' in window.navigator && window.navigator.msPointerEnabled) {
      // Internet Explorer 10 style
      this.eventTouchstart = 'MSPointerDown'
      this.eventTouchmove = 'MSPointerMove'
      this.eventTouchend = 'MSPointerUp'
    }
    else {
      this.eventTouchstart = 'touchstart'
      this.eventTouchmove = 'touchmove'
      this.eventTouchend = 'touchend'
    }

    this.retryButton = this.view.refs.retryButton
    this.restartButton = this.view.refs.restartButton
    this.keepPlayingButton = this.view.refs.keepPlayingButton
    this.gameContainer = this.view.refs.gameContainer

    this.listen()
  }

  on(event: InputEventName, callback: InputCallback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  emit(event: InputEventName, data = 0 as Direction) {
    const callbacks = this.events[event]
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback(data)
      })
    }
  }

  listen() {
    // Respond to direction keys
    document.addEventListener('keydown', this.keyboardHandler)

    // Respond to button presses
    this.bindButtonPress(this.retryButton, this.retryHandler)
    this.bindButtonPress(this.restartButton, this.restartHandler)
    this.bindButtonPress(this.keepPlayingButton, this.keepPlayingHandler)

    this.gameContainer.addEventListener(this.eventTouchstart, this.touchStartHandler)
    this.gameContainer.addEventListener('mousedown', this.touchStartHandler)

    this.gameContainer.addEventListener(this.eventTouchmove, this.touchMoveHandler)

    this.gameContainer.addEventListener(this.eventTouchend, this.touchEndHandler)
    this.gameContainer.addEventListener('mouseup', this.touchEndHandler)
  }

  restart(event: Event) {
    event.preventDefault()
    this.emit('restart')
  }

  keepPlaying(event: Event) {
    event.preventDefault()
    this.emit('keepPlaying')
  }

  bindButtonPress(button: HTMLElement, handler: EventListener) {
    button.addEventListener('click', handler)
    button.addEventListener(this.eventTouchend, handler)
  }

  removeButtonPress(button: HTMLElement, handler: EventListener) {
    button.removeEventListener('click', handler)
    button.removeEventListener(this.eventTouchend, handler)
  }

  keyboardEvent(event: KeyboardEvent) {
    const modifiers = event.altKey || event.ctrlKey || event.metaKey
      || event.shiftKey
    const mapped = this.map[event.code]

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault()
        this.emit('move', mapped)
      }
    }

    // R key restarts the game
    if (!modifiers && event.code === 'KeyR') {
      this.restart(event)
    }
  }

  touchStartEvent(event: Event) {
    const hasMsPointer = 'msPointerEnabled' in window.navigator && window.navigator.msPointerEnabled

    if (isTouchLikeEvent(event) && !hasMsPointer && (event.touches.length > 1 || event.targetTouches.length > 1)) {
      return // Ignore if touching with more than 1 finger
    }

    if (isPointerLikeEvent(event)) {
      this.touchStartClientX = event.pageX
      this.touchStartClientY = event.pageY
    }
    else if (isTouchLikeEvent(event)) {
      const touch = event.touches[0]
      if (!touch)
        return

      this.touchStartClientX = touch.clientX
      this.touchStartClientY = touch.clientY
    }

    event.preventDefault()
  }

  touchMoveEvent(event: Event) {
    event.preventDefault()
  }

  touchEndEvent(event: Event) {
    const hasMsPointer = 'msPointerEnabled' in window.navigator && window.navigator.msPointerEnabled

    if (isTouchLikeEvent(event) && !hasMsPointer && (event.touches.length > 0 || event.targetTouches.length > 0)) {
      return // Ignore if still touching with one or more fingers
    }

    let touchEndClientX = 0
    let touchEndClientY = 0

    if (isPointerLikeEvent(event)) {
      touchEndClientX = event.pageX
      touchEndClientY = event.pageY
    }
    else if (isTouchLikeEvent(event)) {
      const touch = event.changedTouches[0]
      if (!touch)
        return

      touchEndClientX = touch.clientX
      touchEndClientY = touch.clientY
    }

    const dx = touchEndClientX - this.touchStartClientX
    const absDx = Math.abs(dx)

    const dy = touchEndClientY - this.touchStartClientY
    const absDy = Math.abs(dy)

    if (Math.max(absDx, absDy) > 10) {
      // (right : left) : (down : up)
      this.emit('move', absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0))
    }
  }

  destroy() {
    document.removeEventListener('keydown', this.keyboardHandler)
    this.removeButtonPress(this.retryButton, this.retryHandler)
    this.removeButtonPress(this.restartButton, this.restartHandler)
    this.removeButtonPress(this.keepPlayingButton, this.keepPlayingHandler)

    this.gameContainer.removeEventListener('mousedown', this.touchStartHandler)
    this.gameContainer.removeEventListener('mouseup', this.touchEndHandler)
    this.gameContainer.removeEventListener(this.eventTouchstart, this.touchStartHandler)
    this.gameContainer.removeEventListener(this.eventTouchmove, this.touchMoveHandler)
    this.gameContainer.removeEventListener(this.eventTouchend, this.touchEndHandler)
  }
}
