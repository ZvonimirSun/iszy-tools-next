<script setup lang="ts">
import type { FormatName, Hsva } from '~/utils/colorTransform'
import { hsvaToFormats, parseToHsva } from '~/utils/colorTransform'

// ─── State ───────────────────────────────────────────────────────────────────
const formats: FormatName[] = ['HEX', 'HEX8', 'RGB', 'RGBA', 'HSL', 'HSLA', 'HSV', 'OKLCH', 'OKLAB', 'P3']

const hsva = ref<Hsva>({ h: 210, s: 65, v: 90, a: 100 })
const inputValue = ref('')
const inputError = ref(false)
const outputFormats = ref<Record<FormatName, string> | null>(null)
const hasInitializedInput = ref(false)
const isInputFocused = ref(false)
const preferredInputFormat = ref<FormatName>('RGBA')

const { copy } = useCopy()

const previewRgba = computed(() => {
  if (!outputFormats.value)
    return 'transparent'

  return outputFormats.value.RGBA
})

function detectPreferredFormat(input: string): FormatName {
  const value = input.trim().toLowerCase()

  if (value.startsWith('oklch('))
    return 'OKLCH'
  if (value.startsWith('oklab('))
    return 'OKLAB'
  if (value.startsWith('color(display-p3'))
    return 'P3'
  if (value.startsWith('hsla('))
    return 'HSLA'
  if (value.startsWith('hsl('))
    return 'HSL'
  if (value.startsWith('rgba('))
    return 'RGBA'
  if (value.startsWith('rgb('))
    return 'RGB'
  if (value.startsWith('hsv('))
    return 'HSV'
  if (value.startsWith('#'))
    return value.length === 9 || value.length === 5 ? 'HEX8' : 'HEX'

  return preferredInputFormat.value
}

function syncInputFromPreferredFormat() {
  if (!outputFormats.value)
    return

  inputValue.value = outputFormats.value[preferredInputFormat.value]
}

// ─── Update format outputs when hsva changes ──────────────────────────────────
async function updateFormats(val: Hsva) {
  outputFormats.value = await hsvaToFormats(val)

  // Keep input synced with picker, but do not override while user is actively typing.
  if (!isInputFocused.value && outputFormats.value) {
    if (!hasInitializedInput.value) {
      hasInitializedInput.value = true
    }
    syncInputFromPreferredFormat()
  }
}

// ─── Parse user text input ────────────────────────────────────────────────────
async function handleColorInput() {
  if (!inputValue.value.trim())
    return
  const result = await parseToHsva(inputValue.value)
  if (result) {
    inputError.value = false
    preferredInputFormat.value = detectPreferredFormat(inputValue.value)
    hsva.value = result
  }
  else {
    inputError.value = true
  }
}

function useOutputFormatAsInput(fmt: FormatName) {
  if (!outputFormats.value)
    return

  preferredInputFormat.value = fmt
  inputValue.value = outputFormats.value[fmt]
  inputError.value = false
}

// ─── Lifecycle: start only on client ─────────────────────────────────────────
onMounted(() => {
  updateFormats(hsva.value)
  watch(hsva, updateFormats, { deep: true })
})
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <!-- Color input (SSR-safe: just a text field) -->
    <ContainerToolItem label="输入颜色">
      <div class="flex items-center gap-3">
        <!-- Live preview swatch -->
        <ClientOnly>
          <div class="size-10 rounded-lg border border-muted shadow-inner checkerboard shrink-0 overflow-hidden">
            <div class="size-full" :style="{ backgroundColor: previewRgba }" />
          </div>
          <template #fallback>
            <USkeleton class="size-10 rounded-lg shrink-0" />
          </template>
        </ClientOnly>

        <div class="flex-1 flex flex-col gap-1">
          <UInput
            v-model="inputValue"
            class="w-full font-mono"
            placeholder="#1a82e6, rgba(0,0,0,0.5), hsl(210,65%,45%), oklch(0.6 0.2 240 / 0.8)…"
            :color="inputError ? 'error' : 'neutral'"
            @focus="isInputFocused = true"
            @blur="isInputFocused = false; handleColorInput()"
            @keydown.enter="handleColorInput"
          />
          <p v-if="inputError" class="text-xs text-red-500 flex items-center gap-1">
            <UIcon name="i-lucide:triangle-alert" class="size-3" />
            无效的颜色格式
          </p>
        </div>
      </div>
    </ContainerToolItem>

    <!-- Picker + Output (ClientOnly – heavy color logic) -->
    <div class="flex flex-col lg:flex-row gap-4 w-full">
      <!-- Color Picker -->
      <ClientOnly>
        <ContainerToolItem label="颜色选择器">
          <ColorPicker v-model="hsva" />
        </ContainerToolItem>

        <template #fallback>
          <ContainerToolItem label="颜色选择器">
            <div class="flex gap-4">
              <USkeleton class="w-42 h-42 rounded-md" />
              <USkeleton class="w-2 h-42 rounded-md" />
              <USkeleton class="w-2 h-42 rounded-md" />
            </div>
          </ContainerToolItem>
        </template>
      </ClientOnly>

      <!-- Format outputs -->
      <ClientOnly>
        <ContainerToolItem label="格式输出" class="flex-1" content-class="flex flex-col gap-2">
          <template v-if="outputFormats">
            <UInput
              v-for="fmt in formats"
              :key="fmt"
              :model-value="outputFormats[fmt]"
              class="w-full font-mono"
              readonly
              :ui="{ base: 'ps-14' }"
            >
              <template #leading>
                <span class="text-xs text-muted font-mono w-10 text-right">{{ fmt }}</span>
              </template>
              <template #trailing>
                <div class="flex items-center">
                  <UTooltip text="将该格式填入输入框" :content="{ side: 'left' }">
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      icon="i-lucide:arrow-up-left"
                      aria-label="使用该格式"
                      @click="useOutputFormatAsInput(fmt)"
                    />
                  </UTooltip>
                  <UTooltip text="复制到剪贴板" :content="{ side: 'left' }">
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      icon="i-lucide:copy"
                      aria-label="复制"
                      @click="copy(outputFormats![fmt])"
                    />
                  </UTooltip>
                </div>
              </template>
            </UInput>
          </template>
        </ContainerToolItem>

        <template #fallback>
          <ContainerToolItem label="格式输出" class="flex-1" content-class="flex flex-col gap-2">
            <USkeleton v-for="fmt in formats" :key="fmt" class="h-9 w-full rounded-md" />
          </ContainerToolItem>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
