import type { PublicUser, ResultDto } from '@zvonimirsun/iszy-common'

export default defineEventHandler(async (event) => {
  const { site: { title } } = usePublicConfig()
  const url = getRequestURL(event)
  const query = getQuery(event)
  const state = query.state as string
  if (!state) {
    throw createError({
      statusCode: 400,
      message: '缺少 state 参数',
    })
  }
  const stateData = await getState(state)
  if (!stateData) {
    throw createError({
      statusCode: 400,
      message: '无效的 state 参数',
    })
  }
  await removeState(state)
  if (!stateData.isBind) {
    // 登录回调，携带 code 参数
    const code = query.code as string
    const error = query.error as string | undefined
    let errorMessage = ''
    if (error || !code) {
      errorMessage = error || '缺少 code 参数'
    }
    if (!errorMessage) {
      try {
        const res = await authFetch<ResultDto<{
          access_token: string
          refresh_token: string
          profile: PublicUser
        }>>(event, `/oauth/token`, {
          method: 'POST',
          query: {
            access_token: code,
          },
        })
        if (!res.success) {
          errorMessage = '获取 token 失败'
        }
        else {
          await setRedisSession(event, {
            access_token: res.data!.access_token,
            refresh_token: res.data!.refresh_token,
          })
        }
      }
      catch (error) {
        errorMessage = '获取 token 失败'
      }
    }
    if (!errorMessage) {
      return `
          <head>
            <title>${title} - 登录成功</title>
            <meta charset="UTF-8">
          </head>
          <body>
            登录成功
            <script>
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage(${JSON.stringify({
                  success: true,
                })}, '${url.origin}');
              }
            </script>
          </body>
        `
    }
    else {
      return `
        <head>
          <title>${title} - 登录失败</title>
          <meta charset="UTF-8">
        </head>
        <body>
          ${error || '缺少 code 参数'}
          <script>
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(${JSON.stringify({
                success: false,
                message: error || '缺少 code 参数',
              })}, '${url.origin}');
            }
          </script>
        </body>
      `
    }
  }
  else {
    // 绑定回调，不携带 code 参数
    const error = query.error as string | undefined

    if (error) {
      return `
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          ${error}
          <script>
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(${JSON.stringify({
                success: false,
                message: error,
              })}, '${url.origin}');
            }
          </script>
        </body>
      `
    }
    else {
      return `
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          验证成功
          <script>
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(${JSON.stringify({
                success: true,
              })}, '${url.origin}');
            }
          </script>
        </body>
      `
    }
  }
})
