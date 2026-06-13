# ISZY Tools Next Agent 指南

本文档用于帮助协作 Agent 快速理解 `iszy-tools-next`。本项目是当前工具站主线，基于 Nuxt 4 实现在线工具集合，并通过 Nitro 服务端接口对接认证、工具权限和部分后端能力。

## 常用命令

不要把 `pnpm build` 当作默认验证步骤。日常改动优先使用 `pnpm lint`、`pnpm typecheck` 或聚焦测试；只有用户明确要求、排查生产构建问题，或改动确实影响构建产物时再执行生产构建。

| 任务 | 命令 |
| --- | --- |
| 安装依赖 | `pnpm install` |
| 启动开发服务 | `pnpm dev` |
| 生产构建 | `pnpm build` |
| 预览生产构建 | `pnpm preview` |
| 代码检查 | `pnpm lint` |
| 自动修复 lint | `pnpm lint:fix` |
| 类型检查 | `pnpm typecheck` |
| 运行全部测试 | `pnpm test` |
| 测试监听模式 | `pnpm test:watch` |
| 单文件测试 | `pnpm vitest run path/to/file.test.ts` |
| 测试覆盖率 | `pnpm test:coverage` |

## 技术栈

- Nuxt 4、Vue 3、TypeScript、pnpm。
- Nuxt UI v4、Tailwind CSS v4。
- Pinia 管理客户端状态，持久化使用项目自定义 IndexedDB 持久化插件。
- Nitro server 负责服务端 API、认证代理和 session 中间件。
- Redis 用于服务端 session 存储。
- Vitest 负责单元测试，ESLint 使用 Antfu 风格配置。

## 部署约束与产品基调

本项目主要是个人项目，部署平台偏轻量，典型服务器规格按 2 核 2G 估算。后续迭代必须优先保护服务端资源，避免把项目演进成重后端 SaaS。

- 工具优先纯前端实现，计算、格式转换、文件处理尽量在浏览器完成。
- 大文件、耗 CPU 的任务优先使用 Web Worker、流式处理、分片处理或浏览器原生能力，避免压到 Nitro 服务端。
- 服务端只承担必要能力：登录态、权限过滤、配置读取、后端 API 代理、OAuth 回调和少量需要隐藏密钥的第三方请求。
- 不做重型任务队列、批量转码、长期后台任务、服务端文件暂存、大规模日志分析等 2 核 2G 难以稳定承载的能力。
- 带状态的工具默认本地优先，使用 IndexedDB/localStorage/Pinia 持久化；账号同步如需引入，只同步轻量 JSON 配置和索引，不同步大文件或中间产物。
- 图床、对象存储、大模型等第三方能力优先走浏览器直连、用户自带 key 或轻量签名/代理模式；确需服务端转发时要考虑限流、超时和失败降级。

## 目录结构

```text
app/
  pages/              # 工具页面和应用页面
  components/         # 通用组件
  composables/        # 通用组合式函数
  stores/             # Pinia stores
  middleware/         # Nuxt 路由中间件
  plugins/            # 客户端/服务端插件
  libs/               # 第三方库封装
server/
  api/                # Nitro API 路由
  middleware/         # Nitro 中间件
  plugins/            # Nitro 插件
  utils/              # 服务端工具函数
  types/              # 服务端类型
shared/
  data/tools.ts       # 工具目录定义
  types/              # 前后端共享类型
  utils/              # 前后端共享工具
```

## 工具页面约定

- 工具目录统一维护在 `shared/data/tools.ts`。
- 工具 `name` 同时作为站内路由路径使用，应使用短横线格式，例如 `bbox-calculator`、`geo-json`、`pdf-to-jpg`。
- 旧的驼峰路径由全局中间件兼容跳转到短横线格式；新增工具时不要新增驼峰路由。
- 简单工具可以放在 `app/pages/<tool-name>.vue`。
- 复杂工具应使用目录形式：`app/pages/<tool-name>/index.vue`，页面专属逻辑放在 `app/pages/<tool-name>/children/`。
- 不要同时创建 `app/pages/<tool-name>.vue` 和 `app/pages/<tool-name>/`。
- `children/` 目录不会作为页面路由使用；测试、类型、worker、服务函数、页面内组件都优先放在这里。
- 以 `_` 开头的页面或目录会被 `nuxt.config.ts` 中的 `pagePattern` 排除出路由。

## 设置页约定

- 设置页入口是 `app/pages/settings/index.vue`。
- 工具专属设置组件放在 `app/pages/settings/children/`。
- 设置组件应调用对应 store 或 composable，不要把工具业务逻辑塞进设置页入口。
- `settings/index.vue` 主要负责账号、全局设置和各工具设置的装载/折叠。

## 认证与权限

- 工具是否需要登录由 `shared/data/tools.ts` 中的 `requiresAuth` 标记控制。
- `server/api/tools/index.get.ts` 会按用户权限过滤工具列表，并设置工具的 `noAccess` 状态。
- 工具权限使用 `tool:<tool-name>:access` 形式，超级权限使用项目既有的全量工具权限语义。
- `app/middleware/auth.global.ts` 根据当前路由匹配工具并执行访问控制：未登录跳转登录页，权限不足抛出 403。
- 服务端持有后端访问凭据，浏览器侧通过 httpOnly session cookie 维持登录态；不要把后端 token 暴露给客户端状态。

## 服务端与配置

- 外部 API 地址通过运行时配置注入，代码中不要硬编码具体域名。
- 服务端请求后端接口应优先使用 `server/utils/authFetch.ts` 等既有工具，以继承 session、凭据和错误处理逻辑。
- `server/middleware/session.ts` 负责 session 读写；`server/utils/sessionStore.ts` 提供 session 存取封装。
- 新增服务端接口时注意区分公开接口和需要登录的接口，不要绕过既有认证约定。
- 新增服务端接口前先判断能否纯前端实现；如果只是格式转换、解析、压缩、文件生成、哈希计算或图片/PDF 处理，默认应放在浏览器端。
- 服务端接口应避免接收和处理大文件。需要上传的场景优先考虑对象存储直传、浏览器本地处理后下载，或明确限制文件大小。
- 服务端代理第三方请求时应设置合理超时、错误返回和必要的速率控制，避免慢请求拖垮小规格实例。

## UI 与样式约定

- 优先使用 Nuxt UI 组件和项目现有布局模式。
- 不要无必要覆盖 Nuxt UI 内部样式。
- Tailwind spacing 类可以使用项目尺度，例如 `w-44`、`gap-4`、`p-3`；避免随意写不可统一维护的固定像素类。
- 页面应直接提供可用工具体验，不做不必要的营销式落地页。
- 表格、画布、编辑器、游戏等固定结构 UI 要注意移动端可用性和内部滚动边界。
- 图标优先使用已安装的 iconify/lucide 图标。

## 状态与持久化

- Pinia store 使用组合式写法，需持久化时使用 `persist: true`。
- 修改 store schema 时要考虑 IndexedDB 中已有用户数据的兼容性。
- 收藏、访问记录等工具关联数据通过工具 `label` 和 `name` 修正；修改工具名时要确认迁移/修正逻辑仍能工作。
- 新增工具数据默认本地保存。跨设备能力优先提供导入/导出，再考虑账号同步。
- 若引入账号同步，只同步收藏、设置、轻量文档索引等小体积数据；不要默认同步用户上传的原始文件、转换产物或大段历史日志。

## 依赖与共享类型

- 优先复用项目已有依赖和工具函数，不要为小逻辑引入重复库。
- 如果直接在源码中使用传递依赖，应把它加入 `package.json` 的显式依赖。
- 涉及共享 DTO、用户、权限、枚举等模型时，优先从 `@zvonimirsun/iszy-common` 导入。
- GIS 相关类型和工具优先复用现有 map-sdk、GeoJSON 工具模块和页面内 `children/` 逻辑。

## 验证建议

- 普通前端改动：优先跑 `pnpm lint` 和 `pnpm typecheck`。
- 工具内部算法改动：补充或运行对应 `*.test.ts`。
- UI 交互、布局、移动端体验相关改动：启动开发服务并用浏览器实际检查。
- 依赖、路由、Nuxt 配置或服务端 API 改动：至少跑类型检查，并按风险补充开发服务验证。
- Worker、文件处理、PDF/图片/GIS 等浏览器端重任务改动：使用中等体积样例文件实际检查主线程是否明显卡顿，必要时补充边界测试。
- 不要在用户未要求时为了验证而长时间保留后台 dev server；需要启动时，结束前确认是否应关闭。

## Git 与改动范围

- 本仓库可能有用户未提交改动，修改前先看 `git status`。
- 不要回滚用户改动；如果无关，保持不动。
- 大规模重命名时，先说明范围，并在验证中区分纯重命名和内容变更。
- 避免无关格式化和批量整理，尤其不要因为小改动重排整个文件或更新无关 lockfile 元数据。
