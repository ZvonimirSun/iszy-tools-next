export type GeoJsonCollapsedSide = 'map' | 'panel' | null

export const useGeoJsonStore = defineStore('geoJson', {
  state: () => ({
    leftPercent: 50,
    desktopCollapsedSide: null as GeoJsonCollapsedSide,
    mobileCollapsedSide: 'panel' as GeoJsonCollapsedSide,
  }),
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGeoJsonStore, import.meta.hot))
}
