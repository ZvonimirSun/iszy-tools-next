// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      site: {
        lang: 'zh-CN',
        title: 'ISZY Tools Next',
        description: 'ISZY Tools Next',
      },
      beian: {
        icp: '',
        gonganNum: '',
        gonganId: '',
      },
      friendLinks: '',
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  eslint: {
    config: {
      standalone: false,
    },
  },
  icon: {
    provider: 'iconify',
  },
})
