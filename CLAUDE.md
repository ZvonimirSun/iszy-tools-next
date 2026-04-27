# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Start dev server (port 3000) | `pnpm dev` |
| Production build | `pnpm build` |
| Preview production build | `pnpm preview` |
| Lint | `pnpm lint` |
| Lint with auto-fix | `pnpm lint:fix` |
| Type-check | `pnpm typecheck` |
| Run all tests | `pnpm test` |
| Run tests in watch mode | `pnpm test:watch` |
| Run a single test file | `pnpm vitest run path/to/file.test.ts` |
| Test with coverage | `pnpm test:coverage` |

## Architecture

### Stack
- **Nuxt 4.x** with **Vue 3.5**, **TypeScript 6**, **pnpm** (workspace)
- **Nuxt UI v4** (Reka UI under the hood) + **TailwindCSS v4**
- **Pinia** for state management, with a custom persisted-state plugin (`@zvonimirsun/pinia-plugin-persistedstate`) using IndexedDB
- **Vitest** for unit tests, **ESLint** with `@antfu/eslint-config`
- **Nitro** server (built into Nuxt) with Redis-backed session storage

### Directory Layout

```
app/                  # Frontend — pages, components, stores, composables, plugins, middleware
  pages/              # File-based routing. Each tool is a page (e.g. pages/base64.vue)
    <tool>/           # Multi-file tools use the Nuxt "children" pattern
      children/       # Page-specific logic: services, types, workers, tests
      index.vue
  components/         # Shared components (editor/, app/Header, app/Footer, etc.)
  stores/             # Pinia stores (tools, user, settings, etc.)
  composables/        # Shared composables (useCopy, useCurrentTool, usePdfManager, etc.)
  middleware/          # Global route middleware (auth checks)
  plugins/            # Nuxt plugins (init: pulls user profile + tools on load)
  libs/               # Wrapper modules for third-party libs (pdf-lib, leaflet, qr-scanner)
server/               # Nitro server
  api/                # API routes (auth/*, tools/*, oauth/*)
  middleware/          # Server middleware (session.ts — attaches Redis session to every request)
  plugins/            # Nitro plugins (redisStorage — mounts Redis driver for unstorage)
  utils/              # Server utilities (authFetch, sessionStore, stateStore)
  types/              # Server-only types
shared/               # Code shared between client & server, auto-imported as #shared
  data/tools.ts       # Tool catalog definition (static list of all tools with labels, categories)
  types/              # Shared TypeScript interfaces (tool, user, editor)
  utils/              # Shared utilities
```

### Key Patterns

**Tool pages** live under `app/pages/`. Simple tools are a single `.vue` file (e.g., `base64.vue`). Complex tools use a directory with `index.vue` and a `children/` subdirectory containing page-specific services, types, workers, and tests. Tests are colocated in `children/` and named `*.test.ts`.

**Pages that begin with `_` or are inside `_*/` directories are excluded from routing** (configured in `nuxt.config.ts` via `pagePattern`).

**Auth flow**: The global middleware `auth.global.ts` checks if the current tool requires authentication (`noAccess` flag). If not logged in, it redirects to `/login`. If logged in but lacking privileges, it throws 403. The `useOriginToolsStore` fetches the filtered tool list from `/api/tools` based on the user's privileges (privilege-driven access control: `tool:<name>:access` or `tool:all:access`).

**Session management**: Server middleware `server/middleware/session.ts` runs on every request, persisting the session cookie to Redis. Server utilities `authFetch.ts` proxies authenticated requests to an external API. `server/utils/sessionStore.ts` provides `getRedisSession`/`setRedisSession`/`destroyRedisSession`.

**Pinia stores** use `persist: true` to opt into IndexedDB persistence (configured in `nuxt.config.ts` runtimeConfig). Stores accept HMR via `acceptHMRUpdate`.

**Icons**: Custom SVG icons live in `app/assets/icons/` and are available via the `custom:` prefix (e.g., `i-custom-<name>`).

**Docker**: Two-stage build — stage 1 builds the Nuxt `.output`, stage 2 runs it behind nginx (serves static files directly, proxies dynamic requests to Nuxt on `127.0.0.1:3000`).

### External Dependencies

The project depends on an external API (`api.ovooo.cc`) — configured via `NUXT_PUBLIC_API_ORIGIN` — for authentication, user profiles, and OAuth. Server API routes proxy these calls using `authFetch()` which attaches the user's session token.
