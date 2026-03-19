export const useTinyEditorStore = defineStore('tinyEditor', {
  state: () => ({
    html: '',
    css: '',
    js: '',
  }),
  persist: true,
})
