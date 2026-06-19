<script setup lang="ts">
import type { AnimationAction, AnimationClip, Material, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { AmbientLight, AnimationMixer, AxesHelper, Box3, Color, DirectionalLight, GridHelper, HemisphereLight, LoadingManager, Mesh, PerspectiveCamera as ThreePerspectiveCamera, Scene as ThreeScene, WebGLRenderer as ThreeWebGLRenderer, Timer, Vector3 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACO_EXTENSION_NAME, findRootFile, getRelativePath, gltfJsonUsesExtension, KTX2_EXTENSION_NAME, normalizePath, readGltfJson } from './children/gltfUtils'
import { useGltfLoaders } from './children/useGltfLoaders'

definePageMeta({ layout: 'bounded' })

const MAP_NAMES = [
  'map',
  'aoMap',
  'emissiveMap',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
  'alphaMap',
  'bumpMap',
  'displacementMap',
  'lightMap',
  'specularMap',
] as const

interface ModelStats {
  animations: number
  materials: number
  meshes: number
  triangles: number
}

const viewportRef = ref<HTMLDivElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const folderInputRef = ref<HTMLInputElement | null>(null)

let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let renderer: WebGLRenderer | null = null
let controls: OrbitControls | null = null
let animationFrame = 0
let resizeObserver: ResizeObserver | null = null
let modelRoot: Object3D | null = null
let mixer: AnimationMixer | null = null
let currentAction: AnimationAction | null = null
const timer = new Timer()
const { disposeLoaders, ensureDracoLoader, ensureKtx2Loader } = useGltfLoaders()

const selectedFiles = shallowRef<File[]>([])
const rootFile = shallowRef<File | null>(null)
const loading = ref(false)
const loadingProgress = ref(0)
const errorMessage = ref('')
const modelUrl = ref('')
const modelStats = ref<ModelStats | null>(null)
const animations = shallowRef<AnimationClip[]>([])
const activeAnimation = ref('')
const dracoDetected = ref(false)
const ktx2Detected = ref(false)
const modelLoaded = ref(false)
const showGrid = ref(true)
const showAxes = ref(false)
const autoRotate = ref(false)
const wireframe = ref(false)
const backgroundColor = ref('#111827')
const objectUrls = new Set<string>()

let gridHelper: GridHelper | null = null
let axesHelper: AxesHelper | null = null

const hasModel = computed(() => modelLoaded.value)
const rootFileName = computed(() => rootFile.value?.name || '未选择模型')
const selectedFileSummary = computed(() => {
  if (!selectedFiles.value.length)
    return '支持 .glb 单文件，或选择包含 .gltf/.bin/贴图的文件夹'
  if (selectedFiles.value.length === 1)
    return formatFileSize(selectedFiles.value[0]!.size)
  return `${selectedFiles.value.length} 个文件`
})

function getSingleFile(file: File | File[] | null | undefined) {
  return Array.isArray(file) ? file[0] : file
}

function formatFileSize(size: number) {
  if (size < 1024)
    return `${size} B`
  if (size < 1024 ** 2)
    return `${(size / 1024).toFixed(2)} KB`
  return `${(size / 1024 ** 2).toFixed(2)} MB`
}

function createObjectUrl(file: File) {
  const url = URL.createObjectURL(file)
  objectUrls.add(url)
  return url
}

function revokeObjectUrls() {
  for (const url of objectUrls)
    URL.revokeObjectURL(url)
  objectUrls.clear()
}

function openFilePicker() {
  fileInputRef.value?.click()
}

function openFolderPicker() {
  folderInputRef.value?.click()
}

function handleSingleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = getSingleFile(input.files ? Array.from(input.files) : null)
  input.value = ''
  if (!file)
    return
  setFiles([file])
}

function handleFolderChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  input.value = ''
  if (!files.length)
    return
  setFiles(files)
}

function setFiles(files: File[]) {
  const gltf = findRootFile(files)
  errorMessage.value = ''
  modelStats.value = null
  animations.value = []
  activeAnimation.value = ''
  dracoDetected.value = false
  ktx2Detected.value = false
  loadingProgress.value = 0

  if (!gltf) {
    selectedFiles.value = []
    rootFile.value = null
    errorMessage.value = '没有找到 .gltf 或 .glb 文件'
    return
  }

  selectedFiles.value = files
  rootFile.value = gltf
  modelUrl.value = getRelativePath(gltf)
}

function createSampleModelFile() {
  const positions = new Float32Array([
    -0.8,
    -0.55,
    0,
    0.8,
    -0.55,
    0,
    0,
    0.8,
    0,
  ])
  const bytes = new Uint8Array(positions.buffer)
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('')
  const uri = `data:application/octet-stream;base64,${btoa(binary)}`
  const gltf = {
    asset: { version: '2.0', generator: 'iszy-tools-next' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: '示例三角面' }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0 },
        material: 0,
      }],
    }],
    materials: [{
      pbrMetallicRoughness: {
        baseColorFactor: [0.18, 0.62, 0.92, 1],
        metallicFactor: 0,
        roughnessFactor: 0.45,
      },
    }],
    buffers: [{ uri, byteLength: bytes.byteLength }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: bytes.byteLength, target: 34962 }],
    accessors: [{
      bufferView: 0,
      byteOffset: 0,
      componentType: 5126,
      count: 3,
      type: 'VEC3',
      min: [-0.8, -0.55, 0],
      max: [0.8, 0.8, 0],
    }],
  }

  return new File([JSON.stringify(gltf)], 'sample-triangle.gltf', { type: 'model/gltf+json' })
}

async function loadSampleModel() {
  setFiles([createSampleModelFile()])
  await nextTick()
  await loadModel()
}

function setupScene() {
  const viewport = viewportRef.value
  if (!viewport)
    return

  scene = new ThreeScene()
  scene.background = new Color(backgroundColor.value)

  camera = new ThreePerspectiveCamera(60, 1, 0.01, 10000)
  camera.position.set(4, 3, 5)

  renderer = new ThreeWebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = 'srgb'
  renderer.domElement.className = 'viewer-canvas'
  viewport.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.autoRotateSpeed = 1.4

  scene.add(new AmbientLight(0xFFFFFF, 1.2))
  scene.add(new HemisphereLight(0xBFDFFF, 0x232323, 1.3))

  const keyLight = new DirectionalLight(0xFFFFFF, 2.5)
  keyLight.position.set(4, 8, 5)
  scene.add(keyLight)

  gridHelper = new GridHelper(10, 20, 0x475569, 0x334155)
  axesHelper = new AxesHelper(3)
  scene.add(gridHelper)
  updateHelpers()

  resizeObserver = new ResizeObserver(resizeRenderer)
  resizeObserver.observe(viewport)
  resizeRenderer()
  timer.connect(document)
  timer.reset()
  animate()
}

function resizeRenderer() {
  const viewport = viewportRef.value
  if (!viewport || !renderer || !camera)
    return

  const width = Math.max(1, viewport.clientWidth)
  const height = Math.max(1, viewport.clientHeight)
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function animate(timestamp?: number) {
  animationFrame = requestAnimationFrame(animate)
  timer.update(timestamp)
  const delta = timer.getDelta()
  controls?.update()
  mixer?.update(delta)
  if (controls)
    controls.autoRotate = autoRotate.value
  if (scene && camera && renderer)
    renderer.render(scene, camera)
}

function updateHelpers() {
  if (!scene)
    return

  if (gridHelper) {
    gridHelper.visible = showGrid.value
  }
  if (axesHelper) {
    if (showAxes.value && !axesHelper.parent)
      scene.add(axesHelper)
    axesHelper.visible = showAxes.value
  }
}

function applyWireframe() {
  modelRoot?.traverse((node) => {
    if (!(node instanceof Mesh))
      return
    const materials = Array.isArray(node.material) ? node.material : [node.material]
    for (const material of materials) {
      if ('wireframe' in material)
        material.wireframe = wireframe.value
    }
  })
}

async function loadModel() {
  if (!rootFile.value || !scene) {
    errorMessage.value = '请先选择模型文件'
    return
  }

  loading.value = true
  loadingProgress.value = 0
  dracoDetected.value = false
  ktx2Detected.value = false
  errorMessage.value = ''
  clearModel()
  revokeObjectUrls()

  const root = rootFile.value
  const rootPath = getRelativePath(root)
  const rootDir = rootPath.includes('/') ? rootPath.slice(0, rootPath.lastIndexOf('/') + 1) : ''
  const fileMap = new Map(selectedFiles.value.map(file => [getRelativePath(file), file]))
  const rootObjectUrl = createObjectUrl(root)
  const rootObjectBase = rootObjectUrl.slice(0, rootObjectUrl.lastIndexOf('/') + 1)

  const manager = new LoadingManager()
  manager.setURLModifier((url: string) => {
    const normalized = normalizePath(url)
    const withoutLoaderPath = normalizePath(
      normalized
        .replace(normalizePath(rootObjectBase), '')
        .replace(normalizePath(rootObjectUrl), ''),
    )
    const candidates = [
      normalizePath(`${rootDir}${normalized}`),
      normalizePath(`${rootDir}${withoutLoaderPath}`),
      withoutLoaderPath,
      normalized,
    ]
    const file = candidates.map(candidate => fileMap.get(candidate)).find(Boolean)
    return file ? createObjectUrl(file) : url
  })

  const loader = new GLTFLoader(manager)

  try {
    const gltfJson = await readGltfJson(root)
    dracoDetected.value = gltfJsonUsesExtension(gltfJson, DRACO_EXTENSION_NAME)
    if (dracoDetected.value)
      await ensureDracoLoader(loader)

    ktx2Detected.value = gltfJsonUsesExtension(gltfJson, KTX2_EXTENSION_NAME)
    if (ktx2Detected.value)
      await ensureKtx2Loader(loader, renderer)

    const gltf = await loader.loadAsync(rootObjectUrl, (event) => {
      if (event.lengthComputable && event.total > 0)
        loadingProgress.value = Math.round((event.loaded / event.total) * 100)
    })

    modelRoot = gltf.scene || gltf.scenes[0] || null
    if (!modelRoot)
      throw new Error('模型中没有可显示的场景')

    scene.add(modelRoot)
    modelLoaded.value = true
    animations.value = gltf.animations || []
    activeAnimation.value = animations.value[0]?.name || ''
    modelStats.value = collectStats(modelRoot, animations.value)
    applyWireframe()
    fitModel()
    playAnimation(activeAnimation.value)
  }
  catch (error) {
    errorMessage.value = (error as Error).message || '模型加载失败'
  }
  finally {
    loading.value = false
    loadingProgress.value = 100
  }
}

function collectStats(root: Object3D, clips: AnimationClip[]): ModelStats {
  const materials = new Set<unknown>()
  let meshes = 0
  let triangles = 0

  root.traverse((node) => {
    if (!(node instanceof Mesh))
      return

    meshes += 1
    const geometry = node.geometry
    const index = geometry.index
    const position = geometry.getAttribute('position')
    triangles += index ? index.count / 3 : position ? position.count / 3 : 0
    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material]
    nodeMaterials.forEach(material => materials.add(material))
  })

  return {
    animations: clips.length,
    materials: materials.size,
    meshes,
    triangles: Math.round(triangles),
  }
}

function fitModel() {
  if (!modelRoot || !camera || !controls)
    return

  const box = new Box3().setFromObject(modelRoot)
  if (box.isEmpty())
    return

  const center = new Vector3()
  const size = new Vector3()
  box.getCenter(center)
  box.getSize(size)

  const maxSize = Math.max(size.x, size.y, size.z)
  const distance = Math.max(maxSize * 1.8, 2)
  camera.position.set(center.x + distance, center.y + distance * 0.7, center.z + distance)
  camera.near = Math.max(distance / 1000, 0.01)
  camera.far = Math.max(distance * 100, 1000)
  camera.updateProjectionMatrix()

  controls.target.copy(center)
  controls.update()
}

function playAnimation(name: string) {
  if (!modelRoot || animations.value.length === 0)
    return

  if (!mixer)
    mixer = new AnimationMixer(modelRoot)

  currentAction?.stop()
  currentAction = null

  const clip = animations.value.find(item => item.name === name) || animations.value[0]
  if (!clip)
    return

  activeAnimation.value = clip.name
  currentAction = mixer.clipAction(clip)
  currentAction.reset().play()
}

function clearModel() {
  currentAction?.stop()
  currentAction = null
  mixer?.stopAllAction()
  mixer = null

  if (!modelRoot || !scene)
    return

  scene.remove(modelRoot)
  modelRoot.traverse((node) => {
    if (!(node instanceof Mesh))
      return

    node.geometry?.dispose()
    const materials = Array.isArray(node.material) ? node.material : [node.material]
    for (const material of materials)
      disposeMaterial(material)
  })
  modelRoot = null
  modelLoaded.value = false
}

function disposeMaterial(material: Material) {
  const materialWithMaps = material as Material & Record<string, { dispose?: () => void } | undefined>
  for (const name of MAP_NAMES) {
    const texture = materialWithMaps[name]
    texture?.dispose?.()
  }
  material.dispose()
}

function resetViewer() {
  clearModel()
  revokeObjectUrls()
  selectedFiles.value = []
  rootFile.value = null
  modelLoaded.value = false
  modelUrl.value = ''
  modelStats.value = null
  animations.value = []
  activeAnimation.value = ''
  dracoDetected.value = false
  ktx2Detected.value = false
  errorMessage.value = ''
  loadingProgress.value = 0
}

watch(showGrid, updateHelpers)
watch(showAxes, updateHelpers)
watch(wireframe, applyWireframe)
watch(backgroundColor, (value) => {
  if (scene)
    scene.background = new Color(value)
})
watch(activeAnimation, (value) => {
  if (value)
    playAnimation(value)
})

onMounted(() => {
  setupScene()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame)
  resizeObserver?.disconnect()
  timer.dispose()
  controls?.dispose()
  clearModel()
  revokeObjectUrls()
  disposeLoaders()
  renderer?.dispose()
  renderer?.domElement.remove()
  scene = null
  camera = null
  renderer = null
  controls = null
})
</script>

<template>
  <div class="gltf-viewer">
    <aside class="toolbar">
      <div class="tool-section">
        <div class="section-title">
          模型文件
        </div>
        <button
          type="button"
          class="file-button"
          @click="openFilePicker"
        >
          <UIcon name="i-lucide:file-box" class="size-5" />
          <span class="min-w-0 flex-1">
            <span class="block truncate font-medium">{{ rootFileName }}</span>
            <span class="block truncate text-xs text-muted">{{ selectedFileSummary }}</span>
          </span>
        </button>
        <div class="grid grid-cols-2 gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:file-up"
            @click="openFilePicker"
          >
            选文件
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:folder-open"
            @click="openFolderPicker"
          >
            选文件夹
          </UButton>
        </div>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide:sparkles"
          block
          :loading="loading"
          @click="loadSampleModel"
        >
          加载示例
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide:box"
          :disabled="!rootFile"
          :loading="loading"
          block
          @click="loadModel"
        >
          加载模型
        </UButton>
        <UProgress v-if="loading" :model-value="loadingProgress" />
        <input
          ref="fileInputRef"
          class="hidden"
          type="file"
          accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
          @change="handleSingleFileChange"
        >
        <input
          ref="folderInputRef"
          class="hidden"
          type="file"
          multiple
          webkitdirectory
          directory
          @change="handleFolderChange"
        >
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        :title="errorMessage"
        icon="i-lucide:circle-alert"
      />

      <div class="tool-section">
        <div class="section-title">
          视图控制
        </div>
        <div class="grid grid-cols-2 gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:focus"
            :disabled="!hasModel"
            @click="fitModel"
          >
            适配
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:trash-2"
            :disabled="!rootFile && !hasModel"
            @click="resetViewer"
          >
            清空
          </UButton>
        </div>
        <UCheckbox v-model="autoRotate" label="自动旋转" />
        <UCheckbox v-model="showGrid" label="显示网格" />
        <UCheckbox v-model="showAxes" label="显示坐标轴" />
        <UCheckbox v-model="wireframe" label="线框模式" :disabled="!hasModel" />
        <UFormField label="背景色">
          <UColorPicker v-model="backgroundColor" format="hex" class="w-full" />
        </UFormField>
      </div>

      <div v-if="animations.length" class="tool-section">
        <div class="section-title">
          动画
        </div>
        <USelect
          v-model="activeAnimation"
          class="w-full"
          :items="animations.map(item => ({ label: item.name || '未命名动画', value: item.name }))"
        />
      </div>

      <div v-if="modelStats" class="tool-section">
        <div class="section-title">
          模型信息
        </div>
        <dl class="stats">
          <div>
            <dt>网格</dt>
            <dd>{{ modelStats.meshes }}</dd>
          </div>
          <div>
            <dt>材质</dt>
            <dd>{{ modelStats.materials }}</dd>
          </div>
          <div>
            <dt>三角面</dt>
            <dd>{{ modelStats.triangles.toLocaleString() }}</dd>
          </div>
          <div>
            <dt>动画</dt>
            <dd>{{ modelStats.animations }}</dd>
          </div>
          <div>
            <dt>Draco</dt>
            <dd>{{ dracoDetected ? '已启用' : '未使用' }}</dd>
          </div>
          <div>
            <dt>KTX2</dt>
            <dd>{{ ktx2Detected ? '已启用' : '未使用' }}</dd>
          </div>
        </dl>
      </div>
    </aside>

    <section class="viewport-wrap">
      <div ref="viewportRef" class="viewport" />
      <div v-if="!hasModel && !loading" class="empty-state">
        <UIcon name="i-lucide:box" class="size-12 text-toned" />
        <div class="text-base font-medium text-highlighted">
          选择 glTF / GLB 模型开始浏览
        </div>
        <div class="max-w-md text-center text-sm text-muted">
          GLB 可直接选择单文件；GLTF 依赖外部贴图或 bin 时请选择整个模型文件夹。
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.gltf-viewer {
  display: grid;
  grid-template-columns: minmax(16rem, 20rem) minmax(0, 1fr);
  gap: 1rem;
  width: 100%;
  height: 100%;
  min-height: 34rem;
}

.toolbar {
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: .75rem;
  padding-right: .25rem;
}

.tool-section {
  display: flex;
  flex-direction: column;
  gap: .65rem;
  border: 1px solid var(--ui-border);
  border-radius: .5rem;
  background: var(--ui-bg-elevated);
  padding: .75rem;
}

.section-title {
  font-size: .875rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.file-button {
  display: flex;
  align-items: center;
  gap: .75rem;
  width: 100%;
  min-width: 0;
  border: 1px solid var(--ui-border);
  border-radius: .5rem;
  background: var(--ui-bg);
  color: var(--ui-text);
  padding: .65rem .75rem;
  text-align: left;
  cursor: pointer;
  transition: background-color .2s ease, border-color .2s ease;

  &:hover {
    border-color: var(--ui-primary);
    background: var(--ui-bg-muted);
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .5rem;

  div {
    border-radius: .375rem;
    background: var(--ui-bg);
    padding: .5rem;
  }

  dt {
    color: var(--ui-text-muted);
    font-size: .75rem;
  }

  dd {
    color: var(--ui-text-highlighted);
    font-size: .95rem;
    font-weight: 600;
  }
}

.viewport-wrap {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-radius: .25rem;
  background: #111827;
}

.viewport {
  position: absolute;
  inset: 0;
}

:deep(.viewer-canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(148, 163, 184, .08) 1px, transparent 1px),
    linear-gradient(rgba(148, 163, 184, .08) 1px, transparent 1px);
  background-size: 2rem 2rem;
}

@media (max-width: 56rem) {
  .gltf-viewer {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(28rem, 1fr);
    height: auto;
    min-height: calc(100vh - var(--ui-header-height, 4rem));
  }

  .toolbar {
    overflow: visible;
  }
}
</style>
