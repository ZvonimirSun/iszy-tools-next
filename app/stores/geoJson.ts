export type GeoJsonCollapsedSide = 'map' | 'panel' | null

export const useGeoJsonStore = defineStore('geoJson', () => {
  const leftPercent = ref(50)
  const desktopCollapsedSide = ref<GeoJsonCollapsedSide>(null)
  const mobileCollapsedSide = ref<GeoJsonCollapsedSide>('panel')

  return {
    leftPercent,
    desktopCollapsedSide,
    mobileCollapsedSide,
  }
}, {
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGeoJsonStore, import.meta.hot))
}
