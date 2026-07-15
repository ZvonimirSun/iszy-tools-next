export interface RsaKeyPairOptions {
  modulusLength: number
}

export interface RsaKeyPairResult {
  publicKey: string
  privateKey: string
}

export async function generateRsaKeyPair(options: RsaKeyPairOptions): Promise<RsaKeyPairResult> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('当前环境不支持 Web Crypto API')
  }

  validateRsaModulusLength(options.modulusLength)

  const keyPair = await globalThis.crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: options.modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )

  const [publicKey, privateKey] = await Promise.all([
    globalThis.crypto.subtle.exportKey('spki', keyPair.publicKey),
    globalThis.crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
  ])

  return {
    publicKey: formatPem('PUBLIC KEY', publicKey),
    privateKey: formatPem('PRIVATE KEY', privateKey),
  }
}

export function validateRsaModulusLength(modulusLength: number) {
  if (!Number.isInteger(modulusLength) || modulusLength < 1024 || modulusLength > 16384 || modulusLength % 8 !== 0) {
    throw new Error('RSA 密钥长度必须是 1024 到 16384 之间且为 8 的倍数')
  }
}

export function formatPem(label: string, data: ArrayBuffer) {
  const base64 = arrayBufferToBase64(data)
  const lines = base64.match(/.{1,64}/g) ?? []
  return [`-----BEGIN ${label}-----`, ...lines, `-----END ${label}-----`].join('\n')
}

function arrayBufferToBase64(data: ArrayBuffer) {
  const bytes = new Uint8Array(data)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}
