<script setup lang="ts">
import { colord } from 'colord'
import colors from './children/colors.json'
import textureUrl from './children/texture.png'

definePageMeta({
  layout: 'wide',
})

interface ChineseColor {
  CMYK: [number, number, number, number]
  RGB: [number, number, number]
  hex: string
  name: string
  pinyin: string
}

type PretextModule = typeof import('@chenglou/pretext')

const colorList = colors as ChineseColor[]

const selectedColor = ref<ChineseColor | null>(null)
const pretextModule = shallowRef<PretextModule | null>(null)

const { copy } = useCopy({ text: '已复制到剪贴板' })

const selectedFontColor = computed(() => {
  if (!selectedColor.value?.hex)
    return '#310f1b'
  return colord(selectedColor.value.hex).isDark() ? '#ffffff' : '#310f1b'
})

const selectedPinyin = computed(() => selectedColor.value?.pinyin.toUpperCase() ?? '')

const namePanel = useTemplateRef('namePanel')
const namePanelWidth = computed(() => {
  if (!import.meta.client) {
    return 0
  }
  if (!namePanel.value) {
    return 0
  }
  return namePanel.value.getBoundingClientRect().width
})

const selectedNameTypography = computed(() => {
  if (!selectedColor.value)
    return { nameSize: 64, pinyinSize: 24 }

  const nameText = selectedColor.value.name
  const pinyinText = selectedPinyin.value
  const availableWidth = namePanelWidth.value

  const nameBaseSize = 100
  const pinyinBaseSize = 54
  const fontFamily = 'Inter, sans-serif'

  const nameWidth = measureNaturalWidth(nameText, `700 ${nameBaseSize}px ${fontFamily}`)
  const pinyinWidth = measureNaturalWidth(pinyinText, `600 ${pinyinBaseSize}px ${fontFamily}`)

  const fittedNameSize = Math.min((availableWidth / Math.max(nameWidth, 1)) * nameBaseSize, 140)
  const acturalNameWidth = measureNaturalWidth(nameText, `700 ${fittedNameSize}px ${fontFamily}`)
  const fittedPinyinSize = acturalNameWidth / Math.max(pinyinWidth, 1) * pinyinBaseSize

  return {
    nameSize: fittedNameSize,
    // Keep pinyin visually secondary while still trying to match the same width.
    pinyinSize: Math.min(fittedPinyinSize, fittedNameSize * 0.58),
  }
})

const cmykText = computed(() => selectedColor.value ? `CMYK(${selectedColor.value.CMYK.join(', ')})` : '')
const rgbText = computed(() => selectedColor.value ? `RGB(${selectedColor.value.RGB.join(', ')})` : '')
const cmykCss = computed(() => selectedColor.value ? `cmyk(${selectedColor.value.CMYK.map((v, i) => i < 3 ? `${v}%` : `${v}%`).join(', ')})` : '')
const rgbCss = computed(() => selectedColor.value ? `rgb(${selectedColor.value.RGB.join(', ')})` : '')
const hexCss = computed(() => selectedColor.value?.hex.toUpperCase() ?? '')

function measureNaturalWidth(text: string, font: string) {
  const module = pretextModule.value
  if (!module || !text) {
    return fallbackWidth(text, font)
  }

  const prepared = module.prepareWithSegments(text, font)
  return module.measureNaturalWidth(prepared)
}

function fallbackWidth(text: string, font: string) {
  const maybeFontSize = Number.parseFloat(font)
  const fontSize = Number.isFinite(maybeFontSize) ? maybeFontSize : 16
  return text.length * fontSize * 0.9
}

function colorText(hex: string) {
  return colord(hex).isDark() ? '#ffffff' : '#310f1b'
}

onMounted(async () => {
  pretextModule.value = await import('@chenglou/pretext')
})
</script>

<template>
  <div
    class="flex h-full w-full flex-col overflow-hidden rounded-xl bg-cover bg-center"
    :style="{
      backgroundImage: `url(${textureUrl})`,
      backgroundColor: selectedColor?.hex ?? '#ffffff',
    }"
  >
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-200 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="selectedColor"
        class="flex flex-1 max-h-2/3 flex-col gap-3 p-3 sm:flex-row"
      >
        <div
          ref="namePanel"
          class="main-scroll flex flex-1 items-center justify-center overflow-auto text-center"
          :style="{ color: selectedFontColor }"
        >
          <div class="flex flex-col items-center">
            <div
              class="font-bold"
              :style="{
                fontSize: `${selectedNameTypography.nameSize}px`,
                lineHeight: `${selectedNameTypography.nameSize * 1.1}px`,
              }"
            >
              {{ selectedColor.name }}
            </div>
            <div
              class="font-semibold"
              :style="{
                fontSize: `${selectedNameTypography.pinyinSize}px`,
                lineHeight: `${selectedNameTypography.pinyinSize * 1.2}px`,
              }"
            >
              {{ selectedPinyin }}
            </div>
          </div>
        </div>

        <div
          class="main-scroll overflow-auto flex justify-center items-center p-2 sm:p-3"
          :style="{ color: selectedFontColor }"
        >
          <div class="flex flex-col text-lg font-medium">
            <UButton
              variant="link"
              class="cursor-pointer text-lg font-medium hover:opacity-75"
              :style="{ color: selectedFontColor }"
              @click="copy(cmykCss)"
            >
              {{ cmykText }}
            </UButton>
            <UButton
              variant="link"
              class="cursor-pointer text-lg font-medium hover:opacity-75"
              :style="{ color: selectedFontColor }"
              @click="copy(rgbCss)"
            >
              {{ rgbText }}
            </UButton>
            <UButton
              variant="link"
              class="cursor-pointer text-lg font-medium hover:opacity-75"
              :style="{ color: selectedFontColor }"
              @click="copy(hexCss)"
            >
              HEX({{ selectedColor.hex.toUpperCase() }})
            </UButton>
          </div>
        </div>
      </div>
    </Transition>

    <div class="main-scroll min-h-0 flex-1 overflow-auto p-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          v-for="(color, index) in colorList"
          :key="index"
          type="button"
          class="grid cursor-pointer grid-cols-[40%_60%] grid-rows-2 items-center rounded-xl border border-black/20 p-3 text-center transition hover:scale-[1.01]"
          :class="selectedColor?.hex === color.hex ? 'ring-2 ring-primary' : ''"
          :style="{ background: color.hex, color: colorText(color.hex) }"
          @click="selectedColor = color"
        >
          <span class="row-span-2 border-r border-dashed border-black/20 pr-2 flex h-full items-center justify-center">
            {{ color.name }}
          </span>
          <span class="border-b border-dashed border-black/20 pb-1 overflow-hidden text-ellipsis" :title="color.pinyin.toUpperCase()">
            {{ color.pinyin.toUpperCase() }}
          </span>
          <span class="pt-1 font-medium">
            {{ color.hex.slice(1).toUpperCase() }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-scroll {
  scrollbar-color: rgba(100, 116, 139, 0.45) transparent;
}

.main-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style>
