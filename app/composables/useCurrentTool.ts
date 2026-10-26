export function useCurrentTool() {
  const route = useRoute()
  return computed(() => getCurrentTool(route))
}
