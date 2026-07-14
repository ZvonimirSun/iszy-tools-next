export interface BasicAuthInput {
  username: string
  password: string
}

export function createBasicAuthToken({ username, password }: BasicAuthInput) {
  return encodeBase64Utf8(`${username}:${password}`)
}

export function createBasicAuthHeader(input: BasicAuthInput) {
  return `Authorization: Basic ${createBasicAuthToken(input)}`
}

function encodeBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  if (typeof btoa === 'function') {
    return btoa(binary)
  }

  return Buffer.from(bytes).toString('base64')
}
