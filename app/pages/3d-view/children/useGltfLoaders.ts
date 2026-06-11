import type { WebGLRenderer } from 'three'
import type { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { LoadingManager } from 'three'
import basisTranscoderUrl from 'three/examples/jsm/libs/basis/basis_transcoder.js?url'
import basisTranscoderWasmUrl from 'three/examples/jsm/libs/basis/basis_transcoder.wasm?url'
import dracoDecoderUrl from 'three/examples/jsm/libs/draco/gltf/draco_decoder.js?url'
import dracoDecoderWasmUrl from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url'
import dracoWasmWrapperUrl from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url'

const DRACO_DECODER_URLS: Record<string, string> = {
  'draco_decoder.js': dracoDecoderUrl,
  'draco_decoder.wasm': dracoDecoderWasmUrl,
  'draco_wasm_wrapper.js': dracoWasmWrapperUrl,
}
const KTX2_TRANSCODER_URLS: Record<string, string> = {
  'basis_transcoder.js': basisTranscoderUrl,
  'basis_transcoder.wasm': basisTranscoderWasmUrl,
}

function mapLoaderAsset(urls: Record<string, string>, url: string) {
  return urls[url.split('/').pop() || ''] || url
}

export function useGltfLoaders() {
  let dracoLoader: DRACOLoader | null = null
  let ktx2Loader: KTX2Loader | null = null

  async function ensureDracoLoader(loader: GLTFLoader) {
    if (!dracoLoader) {
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js')
      const dracoManager = new LoadingManager()
      dracoManager.setURLModifier((url: string) => mapLoaderAsset(DRACO_DECODER_URLS, url))
      dracoLoader = new DRACOLoader(dracoManager)
      dracoLoader.setDecoderConfig({ type: 'wasm' })
    }

    loader.setDRACOLoader(dracoLoader)
  }

  async function ensureKtx2Loader(loader: GLTFLoader, renderer: WebGLRenderer | null) {
    if (!renderer)
      throw new Error('KTX2 转码器初始化失败：渲染器尚未就绪')

    if (!ktx2Loader) {
      const { KTX2Loader } = await import('three/examples/jsm/loaders/KTX2Loader.js')
      const ktx2Manager = new LoadingManager()
      ktx2Manager.setURLModifier((url: string) => mapLoaderAsset(KTX2_TRANSCODER_URLS, url))
      ktx2Loader = new KTX2Loader(ktx2Manager)
      ktx2Loader.detectSupport(renderer)
    }

    loader.setKTX2Loader(ktx2Loader)
  }

  function disposeLoaders() {
    dracoLoader?.dispose()
    dracoLoader = null
    ktx2Loader?.dispose()
    ktx2Loader = null
  }

  return {
    disposeLoaders,
    ensureDracoLoader,
    ensureKtx2Loader,
  }
}
