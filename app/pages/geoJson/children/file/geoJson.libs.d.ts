declare module 'but-unzip' {
  export function iter(data: Uint8Array): Iterable<{
    filename: string
    read: () => Promise<Uint8Array>
  }>
}
