import type { GeoJSON } from '@zvonimirsun/map-sdk'

export type GeoJsonImportFormat = 'geojson' | 'geojsonl' | 'shapefile'
export type GeoJsonExportFormat = 'geojson' | 'geojsonl' | 'shapefile'

export interface GeoJsonExportOptions {
  format: GeoJsonExportFormat
  pretty?: boolean
  featureBbox?: boolean
}

export interface GeoJsonExportResult {
  blob: Blob
  filename: string
}

export interface GeoJsonWorkerSuccess<T> {
  type: 'done'
  taskId: string
  result: T
}

export interface GeoJsonWorkerFailure {
  type: 'error'
  taskId: string
  error: string
}

export type GeoJsonWorkerResponse<T> = GeoJsonWorkerSuccess<T> | GeoJsonWorkerFailure

export type ImportedGeoJson = GeoJSON
