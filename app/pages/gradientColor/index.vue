<script setup lang="ts">
import type { Hsva } from '~/utils/colorTransform'
import { converter, formatHex } from 'culori'

type InterpolationSpace = 'rgb' | 'hsv' | 'oklch'

interface GradientStop {
  index: number
  hex: string
}

const interpolationSpace = ref<InterpolationSpace>('rgb')
const interpolationSpaceOptions = [
  { label: 'RGB', value: 'rgb' },
  { label: 'HSV', value: 'hsv' },
  { label: 'OKLCH', value: 'oklch' },
]

const startHsva = ref<Hsva>({ h: 12, s: 94, v: 96, a: 100 })
const endHsva = ref<Hsva>({ h: 220, s: 88, v: 96, a: 100 })
const count = ref(8)

const { copy } = useCopy()

const toRgb = converter('rgb')
const toOklch = converter('oklch')

const safeCount = computed(() => {
  const numeric = Number(count.value)
  if (!Number.isFinite(numeric))
    return 2
  return Math.min(256, Math.max(2, Math.trunc(numeric)))
})

watch([startHsva, endHsva], ([start, end]) => {
  if (start.a !== 100)
    start.a = 100
  if (end.a !== 100)
    end.a = 100
}, { deep: true })

watch(safeCount, (val) => {
  if (count.value !== val)
    count.value = val
})

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function normalizeHue(value: number) {
  const normalized = value % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t
}

function shortestHueDelta(start: number, end: number) {
  return ((end - start + 540) % 360) - 180
}

function hsvaToColor(hsva: Hsva) {
  return {
    mode: 'hsv' as const,
    h: normalizeHue(hsva.h),
    s: clamp01(hsva.s / 100),
    v: clamp01(hsva.v / 100),
    alpha: 1,
  }
}

function toHex(color: object) {
  return (formatHex(color as never) ?? '#000000').toUpperCase()
}

function resolveHue(startHue?: number, endHue?: number, t = 0) {
  const hasStartHue = typeof startHue === 'number' && !Number.isNaN(startHue)
  const hasEndHue = typeof endHue === 'number' && !Number.isNaN(endHue)

  if (hasStartHue && hasEndHue)
    return normalizeHue(startHue! + shortestHueDelta(startHue!, endHue!) * t)
  if (hasStartHue)
    return normalizeHue(startHue!)
  if (hasEndHue)
    return normalizeHue(endHue!)
  return undefined
}

function interpolateHex(t: number) {
  const start = startHsva.value
  const end = endHsva.value

  if (interpolationSpace.value === 'hsv') {
    const h = normalizeHue(start.h + shortestHueDelta(start.h, end.h) * t)
    const s = clamp01(lerp(start.s / 100, end.s / 100, t))
    const v = clamp01(lerp(start.v / 100, end.v / 100, t))
    return toHex({ mode: 'hsv', h, s, v, alpha: 1 })
  }

  if (interpolationSpace.value === 'oklch') {
    const startOklch = toOklch(hsvaToColor(start))
    const endOklch = toOklch(hsvaToColor(end))

    const l = clamp01(lerp(startOklch.l ?? 0, endOklch.l ?? 0, t))
    const c = Math.max(0, lerp(startOklch.c ?? 0, endOklch.c ?? 0, t))
    const h = resolveHue(startOklch.h, endOklch.h, t)

    return h === undefined
      ? toHex({ mode: 'oklch', l, c, alpha: 1 })
      : toHex({ mode: 'oklch', l, c, h, alpha: 1 })
  }

  const startRgb = toRgb(hsvaToColor(start))
  const endRgb = toRgb(hsvaToColor(end))

  const r = clamp01(lerp(startRgb.r ?? 0, endRgb.r ?? 0, t))
  const g = clamp01(lerp(startRgb.g ?? 0, endRgb.g ?? 0, t))
  const b = clamp01(lerp(startRgb.b ?? 0, endRgb.b ?? 0, t))

  return toHex({ mode: 'rgb', r, g, b, alpha: 1 })
}

const gradientStops = computed<GradientStop[]>(() => {
  const total = safeCount.value
  const denominator = Math.max(1, total - 1)

  return Array.from({ length: total }, (_, index) => ({
    index: index + 1,
    hex: interpolateHex(index / denominator),
  }))
})

const allHex = computed(() => gradientStops.value.map(item => item.hex))

const startHex = computed(() => toHex(hsvaToColor(startHsva.value)))
const endHex = computed(() => toHex(hsvaToColor(endHsva.value)))

const gradientCss = computed(() => `linear-gradient(to right, ${allHex.value.join(', ')})`)

const gradientPreviewStyle = computed(() => ({
  backgroundImage: gradientCss.value,
}))

async function copyCardHex(hex: string) {
  await copy(hex)
}

async function copyAllHex() {
  if (!allHex.value.length)
    return
  await copy(allHex.value.join(','))
}

async function copyGradientCss() {
  if (!allHex.value.length)
    return
  await copy(gradientCss.value)
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <ContainerToolItem label="渐变配置" content-class="flex flex-col gap-4">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <UFormField label="插值空间">
          <USelect
            v-model="interpolationSpace"
            class="w-full"
            :items="interpolationSpaceOptions"
          />
        </UFormField>

        <UFormField label="渐变个数">
          <UInputNumber
            v-model="count"
            class="w-full"
            orientation="vertical"
            :min="2"
            :max="256"
            :step="1"
            :step-strictly="true"
          />
        </UFormField>

        <ClientOnly>
          <UFormField label="开始颜色">
            <UPopover>
              <UButton color="neutral" variant="outline" class="w-full justify-start cursor-pointer">
                <template #leading>
                  <span :style="{ backgroundColor: startHex }" class="size-3 rounded-full border border-muted shrink-0" />
                </template>
                <span class="flex-1 truncate text-left font-mono">{{ startHex }}</span>
              </UButton>

              <template #content>
                <ColorPicker v-model="startHsva" :alpha="false" class="p-2" />
              </template>
            </UPopover>
          </UFormField>

          <UFormField label="结束颜色">
            <UPopover>
              <UButton color="neutral" variant="outline" class="w-full justify-start cursor-pointer">
                <template #leading>
                  <span :style="{ backgroundColor: endHex }" class="size-3 rounded-full border border-muted shrink-0" />
                </template>
                <span class="flex-1 truncate text-left font-mono">{{ endHex }}</span>
              </UButton>

              <template #content>
                <ColorPicker v-model="endHsva" :alpha="false" class="p-2" />
              </template>
            </UPopover>
          </UFormField>

          <template #fallback>
            <UFormField label="开始颜色">
              <USkeleton class="h-9 w-full rounded-md" />
            </UFormField>
            <UFormField label="结束颜色">
              <USkeleton class="h-9 w-full rounded-md" />
            </UFormField>
          </template>
        </ClientOnly>
      </div>
    </ContainerToolItem>

    <ContainerToolItem label="渐变预览" content-class="flex flex-col gap-3">
      <div
        class="w-full h-14 rounded-lg border border-muted"
        :style="gradientPreviewStyle"
      />

      <div class="flex flex-wrap items-center gap-2">
        <UBadge color="neutral" variant="subtle">
          共 {{ safeCount }} 个 HEX
        </UBadge>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide:braces"
          class="cursor-pointer"
          :disabled="!allHex.length"
          @click="copyGradientCss"
        >
          复制 CSS 渐变语句
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide:copy"
          class="cursor-pointer"
          :disabled="!allHex.length"
          @click="copyAllHex"
        >
          复制全部 HEX（逗号拼接）
        </UButton>
      </div>
    </ContainerToolItem>

    <ContainerToolItem label="结果卡片（点击卡片复制当前 HEX）">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <button
          v-for="item in gradientStops"
          :key="`${item.index}-${item.hex}`"
          type="button"
          class="rounded-lg border border-muted bg-elevated/30 p-3 text-left transition-colors hover:border-primary hover:bg-elevated/60 cursor-pointer"
          @click="copyCardHex(item.hex)"
        >
          <span
            class="block h-14 rounded-md border border-muted"
            :style="{ backgroundColor: item.hex }"
          />
          <span class="mt-2 flex items-center justify-between gap-2">
            <span class="text-xs text-muted">#{{ item.index }}</span>
            <span class="font-mono text-sm text-highlighted">{{ item.hex }}</span>
          </span>
        </button>
      </div>
    </ContainerToolItem>
  </div>
</template>
