// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      site: {
        title: 'ISZY Tools Next',
        description: 'ISZY Tools Next',
      },
      auth: {
        publicRegister: false,
      },
      beian: {
        icp: '',
        gonganNum: '',
        gonganId: '',
      },
      cdnOrigin: '',
      friendLinks: '',
    },
    apiOrigin: '',
    site: {
      showAllTools: false,
    },
    redis: {
      host: '',
      port: 6379,
      password: undefined,
    },
    session: {
      cookieName: 'NUXT_SESSION_ID',
      maxAge: '7d',
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/scripts',
  ],
  css: ['~/assets/css/main.css'],
  eslint: {
    config: {
      standalone: false,
    },
  },
  icon: {
    customCollections: [
      {
        prefix: 'custom',
        dir: './app/assets/icons',
      },
    ],
  },
  scripts: {
    registry: {
      cloudflareWebAnalytics: true,
    },
  },
})
