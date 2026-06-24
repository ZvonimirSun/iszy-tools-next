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
      subtitle: '在线工具箱',
      description: '提供开发调试、文档处理、编码转换、图片处理、GIS 查询等常用在线工具，适合日常办公与技术排查。',
      logo: '',
      image: '',
      cdnOrigin: '',
      apiOrigin: '',
      shortUrlOrigin: '',
      adminOrigin: '',
      favicon: {
        small: '',
        medium: '',
        appleTouchIcon: '',
        safariPinnedTab: '',
        androidManifest: '',
      },
      features: {
        publicRegister: false,
        tlDraw: {
          persistenceKey: '',
        },
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
    '@vite-pwa/nuxt',
    '@nuxtjs/sitemap',
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
    exclude: ['/settings', '/login', '/logout', '/admin', '/api'],
  },
  scripts: {
    registry: {
      cloudflareWebAnalytics: { trigger: 'onNuxtReady' },
    },
  },
  pwa: {
    strategies: 'generateSW',
    registerType: 'autoUpdate',
    manifest: false,
    workbox: {
      maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      navigateFallback: null,
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'iszy-tools-next-pages',
            networkTimeoutSeconds: 3,
            cacheableResponse: {
              statuses: [200],
            },
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24,
            },
          },
        },
      ],
    },
  },
  pages: {
    pattern: pagePattern,
  },
  vite: {
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      include: [
        'reka-ui',
      ],
    },
  },
})
