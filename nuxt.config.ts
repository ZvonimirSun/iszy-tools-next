// https://nuxt.com/docs/api/configuration/nuxt-config
import ms from 'ms'

const extensions = [
  '.js',
  '.jsx',
  '.mjs',
  '.ts',
  '.tsx',
  '.vue',
]
const pagePattern = [
  `**/*{${extensions.join(',')}}`,
  '!**/children/**',
  '!**/_*/**',
  '!**/_*',
]
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      url: 'http://localhost:3000',
      title: 'ISZY Tools Next',
      description: 'ISZY Tools Next',
      logo: '',
      image: '',
      cdnOrigin: '',
      apiOrigin: '',
      favicon: {
        small: '',
        medium: '',
        appleTouchIcon: '',
        safariPinnedTab: '',
        androidManifest: '',
      },
      features: {
        publicRegister: false,
        map: {
          tdtToken: '',
          gaodeToken: '',
        },
      },
      footer: {
        since: '',
        copyright: '',
        beian: {
          enable: false,
          icp: '',
          gonganId: '',
          gonganNum: '',
        },
      },
      piniaPluginPersistedstate: {
        storage: 'indexedDB',
        cookieOptions: {
          maxAge: ms('10y'),
          refresh: true,
          sameSite: 'lax',
        },
        indexedDBOptions: {
          name: 'iszy_tools_next',
          storeName: 'state',
          debounce: 300,
        },
      },
    },
    features: {
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
      domain: '',
    },
  },
  compatibilityDate: '2026-03-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/scripts',
    '@nuxtjs/sitemap',
    '@nuxtjs/partytown',
    '@zvonimirsun/pinia-plugin-persistedstate/nuxt',
    'json-editor-vue/nuxt',
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
  sitemap: {
    xsl: false,
    exclude: ['/settings', '/admin', '/api'],
  },
  scripts: {
    registry: {
      cloudflareWebAnalytics: {
        partytown: true,
        trigger: 'onNuxtReady',
      },
    },
  },
  pages: {
    pattern: pagePattern,
  },
  vite: {
    optimizeDeps: {
      include: [
        'reka-ui',
      ],
    },
  },
})
