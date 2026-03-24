<script setup lang="ts">
import type { Hsva } from '~/utils/colorTransform'
import { useElementBounding, useEventListener, watchPausable, watchThrottled } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import { computed, nextTick, ref } from 'vue'
import { hsvaToRgba } from '~/utils/colorTransform'

const props = withDefaults(defineProps<{
  throttle?: number
  disabled?: boolean
  class?: string
}>(), {
  throttle: 50,
  disabled: false,
})

const modelValue = defineModel<Hsva>({ required: true })

// ─── Draggable helper (mirrors Nuxt UI ColorPicker internals) ───────────────
function useColorDraggable(
  targetRef: Ref<HTMLElement | null>,
  containerRef: Ref<HTMLElement | null>,
  axis: 'x' | 'y' | 'both',
  initial: { x: number, y: number },
  isDisabled: ComputedRef<boolean>,
) {
  const position = ref({ ...initial })
  const pressedDelta = ref<{ x: number, y: number } | undefined>()
  const targetRect = useElementBounding(targetRef)
  const containerRect = useElementBounding(containerRef)

  function start(e: PointerEvent) {
    if (isDisabled.value)
      return e.preventDefault()
    const c = containerRef.value
    pressedDelta.value = {
      x: e.clientX - (c ? e.clientX - containerRect.left.value + c.scrollLeft : targetRect.left.value),
      y: e.clientY - (c ? e.clientY - containerRect.top.value + c.scrollTop : targetRect.top.value),
    }
    move(e)
  }

  function move(e: PointerEvent) {
    if (!pressedDelta.value)
      return
    const c = containerRef.value
    let { x, y } = position.value
    if (c && (axis === 'x' || axis === 'both'))
      x = Math.min(100, Math.max(0, (e.clientX - pressedDelta.value.x) / c.scrollWidth * 100))
    if (c && (axis === 'y' || axis === 'both'))
      y = Math.min(100, Math.max(0, (e.clientY - pressedDelta.value.y) / c.scrollHeight * 100))
    position.value = { x, y }
  }

  function end() { pressedDelta.value = undefined }

  if (import.meta.client) {
    useEventListener(containerRef, 'pointerdown', start)
    useEventListener(window, 'pointermove', move)
    useEventListener(window, 'pointerup', end)
  }

  return { position }
}

// ─── Position ↔ HSV normalizers ─────────────────────────────────────────────
// Hue: 0–360 ↔ y position 0–100 (top = hue 0/red, bottom = hue 360/red)
const hueToY = (h: number) => h * 100 / 360
const yToHue = (y: number) => y / 100 * 360
// Value (brightness): 0–100 ↔ y position 0–100 (inverted: top = bright)
const vToY = (v: number) => 100 - v
const yToV = (y: number) => 100 - y
// Alpha: 0–100 ↔ y position 0–100 (inverted: top = opaque, bottom = transparent)
const alphaToY = (a: number) => 100 - a
const yToAlpha = (y: number) => 100 - y

// ─── Refs & draggable instances ─────────────────────────────────────────────
const isDisabled = computed(() => props.disabled)

const selectorRef = ref<HTMLElement | null>(null)
const selectorThumbRef = ref<HTMLElement | null>(null)
const hueTrackRef = ref<HTMLElement | null>(null)
const hueThumbRef = ref<HTMLElement | null>(null)
const alphaTrackRef = ref<HTMLElement | null>(null)
const alphaThumbRef = ref<HTMLElement | null>(null)

const mv = modelValue.value

const { position: svPos } = useColorDraggable(
  selectorThumbRef,
  selectorRef,
  'both',
  { x: mv.s, y: vToY(mv.v) },
  isDisabled,
)
const { position: huePos } = useColorDraggable(
  hueThumbRef,
  hueTrackRef,
  'y',
  { x: 0, y: hueToY(mv.h) },
  isDisabled,
)
const { position: alphaPos } = useColorDraggable(
  alphaThumbRef,
  alphaTrackRef,
  'y',
  { x: 0, y: alphaToY(mv.a) },
  isDisabled,
)

// ─── Sync: external model → positions ───────────────────────────────────────
const { pause, resume } = watchPausable(modelValue, (hsva) => {
  svPos.value = { x: hsva.s, y: vToY(hsva.v) }
  huePos.value = { x: 0, y: hueToY(hsva.h) }
  alphaPos.value = { x: 0, y: alphaToY(hsva.a) }
})

// ─── Sync: positions → external model (throttled) ───────────────────────────
watchThrottled([svPos, huePos, alphaPos], () => {
  pause()
  modelValue.value = {
    h: yToHue(huePos.value.y),
    s: svPos.value.x,
    v: yToV(svPos.value.y),
    a: yToAlpha(alphaPos.value.y),
  }
  nextTick(resume)
}, { throttle: () => props.throttle })

// ─── Pure-hue color for gradients (HSL with S=100%, L=50%) ──────────────────
function hslToRgbString(hDeg: number): string {
  hDeg = ((hDeg % 360) + 360) % 360
  const h = hDeg / 360
  const q = 0.5 // l < 0.5 ? l*(1+s) : l+s-l*s → 0.5*(1+1)=1 → clamp → just use 1
  // s=1, l=0.5 → q=1, p=0
  function hue2rgb(p: number, qq: number, t: number) {
    if (t < 0)
      t += 1
    if (t > 1)
      t -= 1
    if (t < 1 / 6)
      return p + (qq - p) * 6 * t
    if (t < 1 / 2)
      return qq
    if (t < 2 / 3)
      return p + (qq - p) * (2 / 3 - t) * 6
    return p
  }
  const r = Math.round(hue2rgb(0, q * 2 - 1 > 1 ? 1 : q * 2 - 1, h + 1 / 3) * 255)
  const g = Math.round(hue2rgb(0, q * 2 - 1 > 1 ? 1 : q * 2 - 1, h) * 255)
  const b = Math.round(hue2rgb(0, q * 2 - 1 > 1 ? 1 : q * 2 - 1, h - 1 / 3) * 255)
  return `rgb(${r}, ${g}, ${b})`
}

// Simpler: use the 6-segment HSV-at-full-saturation formula
function pureHueColor(hDeg: number): string {
  hDeg = ((hDeg % 360) + 360) % 360
  const sector = Math.floor(hDeg / 60)
  const f = (hDeg / 60) - sector
  const vals = [
    [255, Math.round(f * 255), 0],
    [Math.round((1 - f) * 255), 255, 0],
    [0, 255, Math.round(f * 255)],
    [0, Math.round((1 - f) * 255), 255],
    [Math.round(f * 255), 0, 255],
    [255, 0, Math.round((1 - f) * 255)],
  ]
  const [r, g, b] = vals[sector % 6]!
  return `rgb(${r}, ${g}, ${b})`
}

const hueColor = computed(() => pureHueColor(yToHue(huePos.value.y)))

// ─── Current full-color RGBA string ─────────────────────────────────────────
const currentRgba = computed(() => {
  const { r, g, b, a } = hsvaToRgba(modelValue.value)
  return `rgba(${r}, ${g}, ${b}, ${a})`
})

// ─── Computed styles ─────────────────────────────────────────────────────────
const selectorStyle = computed(() => ({ backgroundColor: hueColor.value }))

const svThumbStyle = computed(() => ({
  backgroundColor: currentRgba.value,
  left: `${svPos.value.x}%`,
  top: `${svPos.value.y}%`,
}))

const hueThumbStyle = computed(() => ({
  backgroundColor: hueColor.value,
  top: `${huePos.value.y}%`,
}))

// Alpha track: gradient from pure hue color (top/opaque) → transparent (bottom)
const alphaTrackGradientStyle = computed(() => ({
  backgroundImage: `linear-gradient(to bottom, ${hueColor.value}, transparent)`,
}))

const alphaThumbStyle = computed(() => ({
  backgroundColor: currentRgba.value,
  top: `${alphaPos.value.y}%`,
}))
</script>

<template>
  <Primitive
    data-slot="root"
    class="data-disabled:opacity-75" :class="[props.class]"
    :data-disabled="isDisabled || undefined"
  >
    <div data-slot="picker" class="flex gap-4">
      <!-- SV selector (2-D saturation/value panel) -->
      <div
        ref="selectorRef"
        data-slot="selector"
        class="w-42 h-42 rounded-md touch-none shrink-0"
        :style="selectorStyle"
      >
        <div
          data-slot="selectorBackground"
          class="w-full h-full relative rounded-md"
          data-color-picker-background
        >
          <div
            ref="selectorThumbRef"
            data-slot="selectorThumb"
            class="-translate-y-1/2 -translate-x-1/2 absolute size-4 ring-2 ring-white rounded-full cursor-pointer shadow-sm data-disabled:cursor-not-allowed"
            :style="svThumbStyle"
            :data-disabled="isDisabled || undefined"
          />
        </div>
      </div>

      <!-- Hue track (vertical rainbow strip) -->
      <div
        ref="hueTrackRef"
        data-slot="track"
        class="w-2 h-42 relative rounded-md touch-none shrink-0"
        data-color-picker-hue-track
      >
        <div
          ref="hueThumbRef"
          data-slot="trackThumb"
          class="absolute transform -translate-y-1/2 -translate-x-1 size-4 rounded-full ring-2 ring-white cursor-pointer shadow-sm data-disabled:cursor-not-allowed"
          :style="hueThumbStyle"
          :data-disabled="isDisabled || undefined"
        />
      </div>

      <!-- Alpha track (vertical, checkerboard + hue→transparent gradient) -->
      <div
        ref="alphaTrackRef"
        data-slot="alphaTrack"
        class="w-2 h-42 relative rounded-md touch-none shrink-0 overflow-hidden checkerboard [--checker-size:4px]"
      >
        <!-- Gradient overlay (pointer-events-none so drag hits the container) -->
        <div
          class="absolute inset-0 rounded-md pointer-events-none"
          :style="alphaTrackGradientStyle"
        />
        <div
          ref="alphaThumbRef"
          data-slot="alphaTrackThumb"
          class="absolute transform -translate-y-1/2 -translate-x-1 size-4 rounded-full ring-2 ring-white cursor-pointer shadow-sm z-10 data-disabled:cursor-not-allowed"
          :style="alphaThumbStyle"
          :data-disabled="isDisabled || undefined"
        />
      </div>
    </div>
  </Primitive>
</template>

<style scoped>
/* SV panel: white→transparent (horizontal) over black→transparent (vertical) */
[data-color-picker-background] {
  background-image:
    linear-gradient(0deg, #000 0, transparent),
    linear-gradient(90deg, #fff 0, hsla(0, 0%, 100%, 0));
}

/* Hue track: full rainbow spectrum from bottom (red) to top (red) */
[data-color-picker-hue-track] {
  background-image: linear-gradient(
    0deg,
    red,
    #ff0 17%,
    #0f0 33%,
    #0ff 50%,
    #00f 67%,
    #f0f 83%,
    red
  );
}
</style>
