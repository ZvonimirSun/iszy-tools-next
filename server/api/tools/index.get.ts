import { getPublicToolMenus } from '#shared/utils/toolCatalog'

export default defineEventHandler(() => ({
  success: true,
  data: getPublicToolMenus(),
  message: '获取成功',
}))
