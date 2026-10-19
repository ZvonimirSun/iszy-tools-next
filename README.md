# ISZY Tools Next

[![Docker Build CI](https://github.com/ZvonimirSun/iszy-tools-next/actions/workflows/docker.yml/badge.svg)](https://github.com/ZvonimirSun/iszy-tools-next/actions/workflows/docker.yml)

[![Nuxt 4.x](https://img.shields.io/badge/Nuxt-4.x-brightgreen)](https://nuxt.com/) [![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/ZvonimirSun/iszy-tools-next)

一个基于 Nuxt 4 的前端工具集应用。

## 页面缓存与认证

- 首页和公开站内工具使用 24 小时 SWR，首次请求按容器运行时配置生成 HTML，后续共享进程内缓存。容器重启清空缓存；不在 CI 预生成页面，也不将页面缓存写入 Redis。
- 公开目录直接来自代码，不请求用户接口。`GET /api/tools` 仅返回公开分类；`GET /api/tools/member` 返回当前可见的会员应用及 `noAccess`，响应禁止共享缓存。
- `NUXT_FEATURES_SHOW_ALL_TOOLS` 保留现有语义：开启后展示无权限的认证工具入口，访问时仍检查权限；关闭时仅展示有权限的入口。关闭 `NUXT_PUBLIC_FEATURES_AUTH_ENABLED` 后隐藏所有会员应用并跳过认证初始化。
- 登录态在客户端挂载后异步恢复。会员页面在客户端等待登录与权限检查，个人设置、认证流程和 API 不使用共享 SWR。公开 HTML 和 payload 不包含用户资料。
- 认证 layer 使用 `session.renewalScope=api`，页面和静态资源不进行 Redis 会话续期。后端 token 仍只保存在服务端。
- 回退页面缓存时将 `nuxt.config.ts` 中的调用改为 `createPageRouteRules(false)` 并重新构建；会员页面的客户端渲染和私有路由禁止缓存规则继续保留。不要改为全站通配缓存。

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
