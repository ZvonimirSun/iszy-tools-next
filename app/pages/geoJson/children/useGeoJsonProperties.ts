import type { TableColumn } from '@nuxt/ui'
import type { Feature } from '@zvonimirsun/map-sdk/2d'
import type { PropertyRow } from './utils'
import { formatPropertyValue, getProperties, normalizeGeoJsonObject } from './utils'

export function useGeoJsonProperties(featureRows: ComputedRef<Feature[]>) {
  const propertyKeys = computed(() => {
    const keys = new Set<string>()

    for (const feature of featureRows.value) {
      const properties = getProperties(feature)
      for (const key of Object.keys(properties)) {
        keys.add(key)
      }
    }

    return Array.from(keys)
  })

  const propertyTableRows = computed<PropertyRow[]>(() => {
    return featureRows.value.map((feature, index) => {
      const properties = getProperties(feature)
      const row: PropertyRow = {
        __index: index + 1,
      }

      for (const key of propertyKeys.value) {
        row[key] = formatPropertyValue(properties[key])
      }

      return row
    })
  })

  const propertyColumns = computed<TableColumn<PropertyRow>[]>(() => {
    return [
      {
        accessorKey: '__index',
        header: '#',
        size: 64,
      },
      ...propertyKeys.value.map(key => ({
        accessorKey: key,
        header: key,
        size: 160,
      })),
    ]
  })

  return {
    propertyKeys,
    propertyTableRows,
    propertyColumns,
  }
}

export function canShowGeoJsonPropertyTable(data: unknown) {
  const geoJson = normalizeGeoJsonObject(data)
  return geoJson?.type === 'Feature' || geoJson?.type === 'FeatureCollection'
}
