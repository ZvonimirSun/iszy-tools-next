import type { TableColumn } from '@nuxt/ui'
import type { Feature } from '@zvonimirsun/map-sdk/2d'
import type { Ref } from 'vue'
import type { PropertyRow } from './geoJsonUtils'
import { h } from 'vue'
import { formatPropertyValue, getProperties, normalizeGeoJsonObject } from './geoJsonUtils'

interface UseGeoJsonPropertiesOptions {
  selectedFeatureIndex?: Ref<number | null>
  onUpdateProperty?: (featureIndex: number, key: string, value: string) => void
}

interface PropertyCellContext {
  row: {
    original: PropertyRow
  }
}

export function useGeoJsonProperties(featureRows: ComputedRef<Feature[]>, options: UseGeoJsonPropertiesOptions = {}) {
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
        __featureIndex: index,
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
        cell: ({ row }: PropertyCellContext) => {
          const featureIndex = Number(row.original.__featureIndex)

          return h('input', {
            'value': String(row.original[key] ?? ''),
            'class': 'h-7 min-w-32 rounded-md border-0 bg-transparent px-2 text-sm outline-none transition-colors hover:bg-elevated focus:bg-default focus:ring-2 focus:ring-primary/40',
            'aria-label': `编辑 ${key}`,
            'onInput': (event: Event) => {
              if (!Number.isInteger(featureIndex)) {
                return
              }

              options.onUpdateProperty?.(featureIndex, key, (event.target as HTMLInputElement).value)
            },
            'onClick': (event: MouseEvent) => event.stopPropagation(),
            'onKeydown': (event: KeyboardEvent) => event.stopPropagation(),
          })
        },
      })),
    ]
  })

  const propertyTableMeta = computed(() => ({
    class: {
      tr: (row: { original: PropertyRow }) => {
        return Number(row.original.__featureIndex) === options.selectedFeatureIndex?.value
          ? 'geo-json-property-row-selected bg-primary/10 hover:bg-primary/15'
          : ''
      },
    },
  }))

  return {
    propertyKeys,
    propertyTableRows,
    propertyColumns,
    propertyTableMeta,
  }
}

export function canShowGeoJsonPropertyTable(data: unknown) {
  const geoJson = normalizeGeoJsonObject(data)
  return geoJson?.type === 'Feature' || geoJson?.type === 'FeatureCollection'
}
