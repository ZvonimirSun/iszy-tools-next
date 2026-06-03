<script setup lang="ts">
import O from './children/assets/image/O.png'
import Ob from './children/assets/image/Ob.png'
import Oreo from './children/assets/image/oreo.png'
import R from './children/assets/image/R.png'
import Random from './children/assets/image/random.png'

type OreoLayer = 'O' | 'Ob' | 'R' | '-'

interface DrawItem {
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
}

definePageMeta({
  layout: 'full',
})

const output = ref(false)
const loading = ref(true)
const oreoArr = ref<OreoLayer[]>([])
const imgUrl = ref('')

const oImage = useTemplateRef<HTMLImageElement>('oImage')
const rImage = useTemplateRef<HTMLImageElement>('rImage')
const obImage = useTemplateRef<HTMLImageElement>('obImage')
const canvasRef = useTemplateRef<HTMLCanvasElement>('oreoCanvas')

const assets = {
  O,
  R,
  Ob,
  Oreo,
  Random,
}

const oreoStr = computed(() => {
  return oreoArr.value.reduce((str, item) => {
    switch (item) {
      case 'O':
      case 'Ob':
        return `${str}奥`
      case 'R':
        return `${str}利`
      case '-':
        return `${str}与`
      default:
        return str
    }
  }, '')
})

function revokeImageUrl() {
  if (!imgUrl.value)
    return

  URL.revokeObjectURL(imgUrl.value)
  imgUrl.value = ''
}

function addLayer(layer: 'o' | 'r' | '-' | '-1') {
  switch (layer) {
    case 'o':
      oreoArr.value.push(oreoArr.value.length === 0 ? 'O' : 'Ob')
      break
    case 'r':
      oreoArr.value.push('R')
      break
    case '-':
      if (oreoArr.value.length > 0 && oreoArr.value[oreoArr.value.length - 1] !== '-')
        oreoArr.value.push('-')
      break
    case '-1':
      oreoArr.value.pop()
      break
  }
}

function getRandom() {
  for (let i = 0; i < Math.floor(Math.random() * 8) + 1; i++) {
    const random = Math.random() * 5
    const layer = random < 1 ? '-' : random < 3 ? 'o' : 'r'

    for (let j = 0; j < Math.floor(Math.random() * 4) + 1; j++)
      addLayer(layer)
  }

  if (oreoArr.value[oreoArr.value.length - 1] === '-')
    oreoArr.value.pop()

  if (oreoArr.value.length === 0)
    getRandom()
}

function getLayerImage(layer: OreoLayer) {
  if (layer === 'O')
    return oImage.value
  if (layer === 'R')
    return rImage.value
  if (layer === 'Ob')
    return obImage.value
}

async function generateImage() {
  if (oreoArr.value.length === 0)
    return

  loading.value = true
  output.value = true
  revokeImageUrl()

  const layers = [...oreoArr.value]
  if (layers[layers.length - 1] === '-')
    layers.pop()

  const drawArr: DrawItem[] = []
  let height = 0

  for (const layer of layers) {
    if (layer === '-') {
      height += 72
      continue
    }

    const image = getLayerImage(layer)
    if (!image)
      continue

    drawArr.unshift({
      image,
      x: layer === 'R' ? 10 : 0,
      y: height,
      width: layer === 'R' ? 220 : 240,
      height: layer === 'R' ? 155 : 160,
    })
    height += 24
  }

  height += 136

  await nextTick()

  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) {
    loading.value = false
    return
  }

  canvas.width = 240
  canvas.height = height
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (const item of drawArr)
    ctx.drawImage(item.image, item.x, item.y, item.width, item.height)

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
  if (blob)
    imgUrl.value = URL.createObjectURL(blob)

  loading.value = false
}

function backToInput() {
  output.value = false
  oreoArr.value = []
  revokeImageUrl()
}

onMounted(() => {
  window.setTimeout(() => {
    loading.value = false
  }, 700)
})

onBeforeUnmount(() => {
  revokeImageUrl()
})
</script>

<template>
  <div class="oreooo">
    <div
      v-show="loading"
      class="content-loading"
    >
      <img
        :src="assets.Oreo"
        alt=""
        class="loading-img"
      >
    </div>

    <div class="image-preload" aria-hidden="true">
      <img ref="oImage" :src="assets.O" alt="">
      <img ref="rImage" :src="assets.R" alt="">
      <img ref="obImage" :src="assets.Ob" alt="">
    </div>

    <div
      v-show="!loading && !output"
      class="wrapper"
    >
      <div class="title">
        <div class="meta">
          我想要：
        </div>
        <div
          v-show="oreoStr"
          class="input str"
        >
          <span>{{ oreoStr }}</span>
        </div>
        <div
          v-show="!oreoStr"
          class="input str placeholder"
        >
          <span>奥利奥...</span>
          <button
            type="button"
            class="random-button"
            aria-label="随机生成"
            @click="getRandom"
          >
            <img
              :src="assets.Random"
              alt=""
              class="icon"
            >
          </button>
        </div>
      </div>

      <div class="control">
        <button type="button" class="btn" @click="addLayer('o')">
          +奥
        </button>
        <button type="button" class="btn" @click="addLayer('r')">
          +利
        </button>
        <button type="button" class="btn" @click="addLayer('-')">
          +与
        </button>
        <button type="button" class="btn" @click="addLayer('-1')">
          -1
        </button>
      </div>

      <button
        type="button"
        class="index-btn"
        :disabled="oreoArr.length === 0"
        @click="generateImage"
      >
        生成
      </button>
    </div>

    <div
      v-show="!loading && output"
      class="wrapper"
    >
      <div class="title">
        <div class="meta">
          这是你的
        </div>
        <div class="str output">
          {{ oreoStr }}
        </div>
      </div>

      <div class="output-image">
        <canvas ref="oreoCanvas">
          您的浏览器不支持 HTML5 canvas 标签。
        </canvas>
      </div>

      <a
        v-if="imgUrl"
        :href="imgUrl"
        target="_blank"
        download="oreooo.png"
        class="btn"
      >
        查看图片
      </a>
      <button
        type="button"
        class="btn"
        @click="backToInput"
      >
        返回
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@font-face {
  font-family: "Seto";
  src: url("./children/assets/font/Seto.eot");
  src:
    url("./children/assets/font/Seto.eot") format("embedded-opentype"),
    url("./children/assets/font/Seto.woff") format("woff"),
    url("./children/assets/font/Seto.ttf") format("truetype"),
    url("./children/assets/font/Seto.svg") format("svg");
  font-style: normal;
  font-weight: normal;
}

.oreooo {
  --oreo-text: #2f2f2f;
  --oreo-bg: #f7f5f2;
  --oreo-panel: #fffaf2;
  --oreo-border: #e6ded1;
  --oreo-action: #4b4038;
  --oreo-action-hover: #2f2924;

  font-family: "Seto", var(--font-sans), serif;
  width: 100%;
  min-height: calc(100vh - 8rem);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 1rem;
  color: var(--oreo-text);

  * {
    user-select: none;
  }
}

.image-preload {
  display: none;
}

.content-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--ui-bg) 76%, transparent);
  z-index: 2;
}

@keyframes oreooo-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.loading-img {
  width: min(20rem, 62vw);
  height: min(20rem, 62vw);
  animation: oreooo-rotate 6s infinite linear;
}

.wrapper {
  width: min(100%, 46rem);
  text-align: center;
  background-color: var(--oreo-panel);
  border: 1px solid var(--oreo-border);
  border-radius: .5rem;
  box-shadow: 0 1rem 2.75rem rgba(32, 24, 16, .08);
  overflow: hidden;
}

.title {
  padding: clamp(1.5rem, 5vw, 2.5rem) clamp(1rem, 5vw, 2.5rem) 1.25rem;
}

.meta {
  font-size: clamp(1.75rem, 7vw, 2.4rem);
  line-height: 1.35;
  margin-bottom: 1.25rem;
}

.str {
  font-size: clamp(2.25rem, 10vw, 4.6rem);
  line-height: 1.2;
  word-break: break-all;
}

.input {
  min-height: 5.5rem;
  display: flex;
  align-items: center;
  border: .125rem solid var(--oreo-border);
  background-color: var(--oreo-bg);
  padding: .75rem 1rem;
  border-radius: .5rem;

  span {
    flex: 1;
  }

  &.placeholder {
    color: #b8afa4;
  }
}

.random-button {
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: .55;
  transition: opacity .2s ease, transform .2s ease;

  &:hover {
    opacity: .9;
    transform: rotate(14deg);
  }
}

.icon {
  width: 2rem;
  height: 2rem;
}

.control {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: .75rem;
  padding: 0 1rem 1.25rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.75rem;
  min-height: 2.75rem;
  border: .125rem solid var(--oreo-action);
  background: transparent;
  color: var(--oreo-text);
  font-family: inherit;
  font-size: 1.6rem;
  line-height: 1;
  padding: .45rem 1.1rem;
  border-radius: .5rem;
  text-decoration: none;
  cursor: pointer;
  transition: background-color .2s ease, color .2s ease, transform .2s ease;

  &:hover {
    background-color: var(--oreo-action-hover);
    color: white;
    transform: translateY(-1px);
  }
}

.index-btn {
  width: 100%;
  border: 0;
  background-color: var(--oreo-action);
  color: #fff;
  font-family: inherit;
  line-height: 1.2;
  font-size: clamp(2rem, 8vw, 3rem);
  padding: 1.2rem;
  cursor: pointer;
  transition: background-color .2s ease;

  &:hover:not(:disabled) {
    background-color: var(--oreo-action-hover);
  }

  &:disabled {
    opacity: .55;
    cursor: not-allowed;
  }
}

.output {
  margin-bottom: 1.25rem;
}

.output-image {
  display: flex;
  justify-content: center;
  padding: 0 1rem 1.5rem;

  canvas {
    width: min(15rem, 100%);
    height: auto;
  }
}

.output-image + .btn,
.output-image + .btn + .btn {
  margin: 0 .4rem 1.5rem;
}

@media (prefers-color-scheme: dark) {
  .oreooo {
    --oreo-text: #f3ede4;
    --oreo-bg: #2c2825;
    --oreo-panel: #211e1b;
    --oreo-border: #544a40;
    --oreo-action: #756758;
    --oreo-action-hover: #8b7a68;
  }
}
</style>
