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
  '!**/chidren/**',
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
    '@zvonimirsun/pinia-plugin-persistedstate/nuxt',
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
    exclude: ['/settings', '/admin', '/api'],
  },
  scripts: {
    registry: {
      cloudflareWebAnalytics: true,
    },
  },
  pages: {
    pattern: pagePattern,
  },
  vite: {
    optimizeDeps: {
      include: [
        'dayjs', // CJS
        'nanoid',
        'fflate',
        'pdfjs-dist',
        'pdf-lib',
        'vuedraggable', // CJS
        'crypto-js', // CJS
        'reka-ui',
        'culori',
        'uqr',
        'qr-scanner',
      ],
    },
  },
})
