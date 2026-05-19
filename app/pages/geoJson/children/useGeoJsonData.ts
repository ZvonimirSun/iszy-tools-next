import type { FeatureCollection } from '@zvonimirsun/map-sdk/2d'
import { createEmptyFeatureCollection, hasGeoJsonFeatures, toFeatureCollection } from './utils'

export function useGeoJsonData(initialValue: unknown = createEmptyFeatureCollection()) {
  const geoJsonObject = shallowRef<unknown>(initialValue)
  const geoJsonFeatureCollection = computed<FeatureCollection>(() => toFeatureCollection(geoJsonObject.value))
  const featureRows = computed(() => geoJsonFeatureCollection.value.features)
  const hasFeatures = computed(() => hasGeoJsonFeatures(geoJsonFeatureCollection.value))

  function setGeoJsonObject(data: unknown) {
    geoJsonObject.value = data
  }

  function setFeatureCollection(data: unknown) {
    geoJsonObject.value = toFeatureCollection(data)
  }

  return {
    geoJsonObject,
    geoJsonFeatureCollection,
    featureRows,
    hasFeatures,
    setGeoJsonObject,
    setFeatureCollection,
  }
}
