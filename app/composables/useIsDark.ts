export function useIsDark() {
  const colorMode = useColorMode()
  return computed(() => colorMode.value === 'dark')
}
