# ISZY Tools Next

[![Docker Build CI](https://github.com/ZvonimirSun/iszy-tools-next/actions/workflows/docker.yml/badge.svg)](https://github.com/ZvonimirSun/iszy-tools-next/actions/workflows/docker.yml)

[![Nuxt 4.x](https://img.shields.io/badge/Nuxt-4.x-brightgreen)](https://nuxt.com/) [![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/ZvonimirSun/iszy-tools-next)

一个基于 Nuxt 4 的前端工具集应用。

## 页面缓存与认证

- 首页和已注册站内工具使用 24 小时 SWR、60 秒 stale-while-revalidate，首次请求按容器运行时配置生成与站点隔离的通用 HTML 外壳，后续共享进程内缓存。缓存键只使用规范化页面路径，不包含无关 query；容器重启清空缓存；不在 CI 预生成页面，也不将页面缓存写入 Redis。
- 公开目录直接来自代码，不请求用户接口。`GET /api/tools` 仅返回公开分类；`GET /api/tools/member` 返回当前可见的会员应用及 `noAccess`，响应禁止共享缓存。
- `NUXT_FEATURES_SHOW_ALL_TOOLS` 保留现有语义：开启后展示无权限的认证工具入口，访问时仍检查权限；关闭时仅展示有权限的入口。关闭 `NUXT_PUBLIC_FEATURES_AUTH_ENABLED` 后隐藏所有会员应用并跳过认证初始化。
- 登录态在客户端挂载后异步恢复。会员页面在客户端等待登录与权限检查，个人设置、认证流程和 API 不使用共享 SWR。公开 HTML 和 payload 不包含用户资料。
- 认证 layer 使用 `session.renewalScope=api`，页面和静态资源不进行 Redis 会话续期。后端 token 仍只保存在服务端。
- `/api/**`、认证回调和 `/settings` 始终返回 `private, no-store`。页面缓存不会执行会话续期、写用户 Cookie 或查询个人资料；会员工具仍由客户端恢复登录态并由业务 API 鉴权。
- Nitro 2.13.4 的 routeRules 不支持函数式 `getKey`；本项目使用受支持的 `render:before` hook 包装 `defineCachedFunction`，通过 `maxAge=86400`、`staleMaxAge=60` 设置 SWR，并由适配层输出明确的 HTTP 缓存头。routeRules 仅登记页面和私有边界，不叠加第二层 Nitro 路由缓存。只缓存成功、无 Set-Cookie/私有头的渲染结果；未知路径、错误和重定向不进入共享缓存。键中的站点维度来自部署配置 `NUXT_PUBLIC_URL`，不要将多个不同站点配置复用为同一个值。
- Nuxt 的共享页面 payload 仅保留页面路径，避免首位访问者的 query 进入缓存并覆盖其他浏览器的业务参数；不会重定向或删除浏览器 URL 参数。新增依赖 query 的 SSR 工具前必须重新审查此边界。
- `/api/auth/check` 同时返回登录资料与会员目录；客户端复用返回值，兼容已有登录状态时才单独补取会员目录。session memo 仅在单个 H3 event 内生效，正常续期复用读取结果，凭据写入/轮换/注销会更新或失效，不跨请求缓存 token，也不节流原有续期。TTL 仍为 layer 的 `session.maxAge`（默认 7 天），轮换仍保留 30 秒 tombstone，注销仍删除服务端 session。
- 设置持久化只在浏览器恢复，不参与 SSR。账号云端设置作为本地设置的临时覆盖，退出/切换账号时先撤销覆盖并取消旧同步；收藏和历史记录仍为设备本地数据，导航展示继续按权限过滤。

### Cloudflare 发布步骤

本轮不操作线上。手动建立限于 `<TOOLS_HOST>` 的 HTML 候选页面规则：仅 GET/HEAD 的首页和无扩展名工具页面，排除 `/api`、`/api/**`、登录/退出/注册、`/sso/**`、`/settings`、其他认证回调、流式端点及 `/_nuxt/**` 等静态资源。保持既有静态资源规则的独立优先级。不要在 Cloudflare 逐页维护工具名单，源站会只为完整工具目录中已注册且审查过的页面输出 public；候选范围中的未知页面仍为 `private, no-store`。

1. Cache eligibility：**Eligible for cache**。
2. Edge TTL：**Use cache-control header if present, bypass cache if not**；不设置覆盖源站的全站强制时长。
3. Browser TTL：**Respect origin**。
4. Cache key：仅此 HTML 候选范围使用 **Ignore query string**，不应用于 API、回调、流式端点、静态资源或其他依赖 query 生成响应的端点。新增此类页面必须先排除再上线。若当前套餐不支持自定义 key，先保留 CDN 默认 key，不以全站忽略 query 代替；源站键仍已独立修正。
5. 不因通用页面请求带登录 Cookie 就统一 bypass；也不强制忽略源站 `private`、`no-store` 或 `Set-Cookie` 的保护。发布前用带 Cookie 和不带 Cookie 的少量 GET 检查源站最终头及边缘命中情况，不能仅用 HEAD 推断 GET 缓存。

发布新容器且源站验证成功后，执行 Cloudflare **Caching → Configuration → Purge Cache → Custom Purge**：支持按 Host 清理时仅清理 `<TOOLS_HOST>`；否则从 `sharedPagePaths` 导出该域名的页面 URL（包含首页），按当前套餐 API 上限分批按 URL 清理，并检查成功响应。不把“容器已重建”当作清理完成。清理后抽查首页和会员页 GET 的 `Cache-Control`、`CF-Cache-Status`、`Age` 以及 HTML 引用的资源是否可访问。

清理失败必须重试并保留上一版 `/_nuxt/` 带 hash 资源，直到旧 HTML 的缓存寿命（含 stale 窗口）结束且抽查不再引用旧资源；若不能保留旧资源，应回滚至兼容版本而不是继续暴露损坏页面。即便清理 API 返回成功也不能假定所有边缘节点立即更新。Nginx 只透传 Cache-Control/Set-Cookie 等源站响应头，不新增 `proxy_cache`、文件缓存或 `add_header` 覆盖策略。

### 发布前待验证

在独立验证环境检查匿名/A/B HTML 与 payload 隔离、query 变体和客户端 room 参数、最终缓存头、API 私有边界、session 请求内复用及权限结果。浏览器登录、账号切换、配置/收藏展示、会员页元信息稳定性及真实业务后端鉴权仍需回归，不能用源码检查代替。集成测试脚本不随仓库提供，本轮不再在本地执行测试，也不运行压测或性能基准。

## 文档

详细架构、工具目录和代码索引请查看 [DeepWiki](https://deepwiki.com/ZvonimirSun/iszy-tools-next)。

## 项目安装

```shell
pnpm install
```

### 启动开发服务器

```shell
pnpm dev
```

### 为生产环境构建产物

```shell
pnpm build
```

### 本地预览生产构建产物

```shell
pnpm preview
```
