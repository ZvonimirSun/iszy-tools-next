import process from 'node:process'
import mustache from 'mustache'

const iconRemoteUrl = process.env.NUXT_ICON_REMOTE_URL || 'https://cdn.jsdelivr.net/npm/@iconify-json/{{name}}/icons.json'

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
    serverBundle: {
      mode: 'auto',
      remote: (name: string) => {
        return mustache.render(iconRemoteUrl, { name })
      },
    },
  },
})
