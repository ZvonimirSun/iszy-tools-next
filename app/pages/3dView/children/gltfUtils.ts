export const DRACO_EXTENSION_NAME = 'KHR_draco_mesh_compression'
export const KTX2_EXTENSION_NAME = 'KHR_texture_basisu'

export function normalizePath(path: string) {
  return decodeURI(path).replaceAll('\\', '/').replace(/^\.?\//, '')
}

export function getRelativePath(file: File) {
  const withPath = file as File & { webkitRelativePath?: string }
  return normalizePath(withPath.webkitRelativePath || file.name)
}

export function findRootFile(files: File[]) {
  return files.find(file => /\.(?:glb|gltf)$/i.test(file.name)) || null
}

export async function readGltfJson(file: File) {
  try {
    if (/\.gltf$/i.test(file.name))
      return await file.text()

    if (!/\.glb$/i.test(file.name))
      return ''

    const buffer = await file.arrayBuffer()
    const view = new DataView(buffer)
    const magic = view.getUint32(0, true)
    const version = view.getUint32(4, true)
    if (magic !== 0x46546C67 || version !== 2)
      return ''

    const jsonChunkLength = view.getUint32(12, true)
    const jsonChunkType = view.getUint32(16, true)
    if (jsonChunkType !== 0x4E4F534A)
      return ''

    const jsonBytes = new Uint8Array(buffer, 20, jsonChunkLength)
    return new TextDecoder().decode(jsonBytes)
  }
  catch {
    return ''
  }
}

export async function fileUsesExtension(file: File, extensionName: string) {
  try {
    const json = await readGltfJson(file)
    return gltfJsonUsesExtension(json, extensionName)
  }
  catch {
    return false
  }
}

export function gltfJsonUsesExtension(json: string, extensionName: string) {
  return json.includes(extensionName)
}

export async function fileUsesDraco(file: File) {
  return fileUsesExtension(file, DRACO_EXTENSION_NAME)
}

export async function fileUsesKtx2(file: File) {
  return fileUsesExtension(file, KTX2_EXTENSION_NAME)
}
