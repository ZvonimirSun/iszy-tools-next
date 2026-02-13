import { zip } from 'fflate'

export async function createZip(files: { name: string, data: Uint8Array | File | Blob }[]): Promise<Blob> {
  const fileMap: Record<string, Uint8Array> = {}
  for (const file of files) {
    const { name, data } = file
    if (isUint8Array(data)) {
      fileMap[name] = data
    }
    else if (data instanceof File || data instanceof Blob) {
      const buffer = await data.arrayBuffer()
      fileMap[name] = new Uint8Array(buffer)
    }
    else {
      throw new TypeError(`Unsupported data type for file ${name}`)
    }
  }

  return new Promise((resolve, reject) => {
    zip(fileMap, (err, zipped) => {
      if (err) {
        return reject(err)
      }
      resolve(new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' }))
    })
  })
}
