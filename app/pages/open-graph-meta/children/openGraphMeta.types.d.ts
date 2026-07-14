declare module '@it-tools/oggen' {
  export type MetadataValue = boolean | string | Date | number

  export interface MetadataConfig {
    [key: string]: MetadataValue | MetadataValue[] | MetadataConfig
  }

  export function generateMeta(
    metadata: MetadataConfig,
    options?: {
      indentation?: number
      indentWith?: string
      generateTwitterCompatibleMeta?: boolean
    },
  ): string
}
