export const useTinyEditorStore = defineStore('tinyEditor', () => {
  const html = ref('')
  const css = ref('')
  const js = ref('')

  return {
    html,
    css,
    js,
  }
}, {
  persist: true,
})
