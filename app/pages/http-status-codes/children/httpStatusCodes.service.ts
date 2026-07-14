export interface HttpStatusCode {
  code: number
  phrase: string
  description: string
}

export interface HttpStatusGroup {
  label: string
  range: string
  codes: HttpStatusCode[]
}

export const httpStatusGroups: HttpStatusGroup[] = [
  {
    label: '1xx 信息响应',
    range: '100-103',
    codes: [
      { code: 100, phrase: 'Continue', description: '客户端可以继续发送请求体。' },
      { code: 101, phrase: 'Switching Protocols', description: '服务器同意切换到客户端请求的协议。' },
      { code: 102, phrase: 'Processing', description: '服务器已收到请求，仍在处理。' },
      { code: 103, phrase: 'Early Hints', description: '在最终响应前预先返回部分响应头。' },
    ],
  },
  {
    label: '2xx 成功',
    range: '200-226',
    codes: [
      { code: 200, phrase: 'OK', description: '请求成功。' },
      { code: 201, phrase: 'Created', description: '请求成功并创建了新资源。' },
      { code: 202, phrase: 'Accepted', description: '请求已接受，但尚未处理完成。' },
      { code: 203, phrase: 'Non-Authoritative Information', description: '响应来自转换代理或非权威来源。' },
      { code: 204, phrase: 'No Content', description: '请求成功，但没有响应体。' },
      { code: 205, phrase: 'Reset Content', description: '请求成功，客户端应重置当前视图。' },
      { code: 206, phrase: 'Partial Content', description: '服务器返回了范围请求的一部分内容。' },
      { code: 207, phrase: 'Multi-Status', description: 'WebDAV 多状态响应。' },
      { code: 208, phrase: 'Already Reported', description: 'WebDAV 绑定成员已在前文枚举。' },
      { code: 226, phrase: 'IM Used', description: '服务器完成了实例操作并返回结果。' },
    ],
  },
  {
    label: '3xx 重定向',
    range: '300-308',
    codes: [
      { code: 300, phrase: 'Multiple Choices', description: '请求有多个可选响应。' },
      { code: 301, phrase: 'Moved Permanently', description: '资源已永久移动到新地址。' },
      { code: 302, phrase: 'Found', description: '资源临时位于其他地址。' },
      { code: 303, phrase: 'See Other', description: '客户端应使用 GET 访问另一个地址。' },
      { code: 304, phrase: 'Not Modified', description: '资源未修改，可使用缓存。' },
      { code: 305, phrase: 'Use Proxy', description: '历史状态码，表示应通过代理访问。' },
      { code: 307, phrase: 'Temporary Redirect', description: '临时重定向，方法和请求体不应改变。' },
      { code: 308, phrase: 'Permanent Redirect', description: '永久重定向，方法和请求体不应改变。' },
    ],
  },
  {
    label: '4xx 客户端错误',
    range: '400-451',
    codes: [
      { code: 400, phrase: 'Bad Request', description: '请求语法或参数无效。' },
      { code: 401, phrase: 'Unauthorized', description: '请求需要认证或认证失败。' },
      { code: 402, phrase: 'Payment Required', description: '预留状态码。' },
      { code: 403, phrase: 'Forbidden', description: '服务器理解请求，但拒绝执行。' },
      { code: 404, phrase: 'Not Found', description: '资源不存在。' },
      { code: 405, phrase: 'Method Not Allowed', description: '资源不支持当前 HTTP 方法。' },
      { code: 406, phrase: 'Not Acceptable', description: '无法生成客户端可接受的响应。' },
      { code: 407, phrase: 'Proxy Authentication Required', description: '需要代理认证。' },
      { code: 408, phrase: 'Request Timeout', description: '服务器等待请求超时。' },
      { code: 409, phrase: 'Conflict', description: '请求与当前资源状态冲突。' },
      { code: 410, phrase: 'Gone', description: '资源已永久删除。' },
      { code: 411, phrase: 'Length Required', description: '请求缺少 Content-Length。' },
      { code: 412, phrase: 'Precondition Failed', description: '请求头中的前置条件不满足。' },
      { code: 413, phrase: 'Content Too Large', description: '请求体过大。' },
      { code: 414, phrase: 'URI Too Long', description: '请求 URI 过长。' },
      { code: 415, phrase: 'Unsupported Media Type', description: '请求媒体类型不受支持。' },
      { code: 416, phrase: 'Range Not Satisfiable', description: '范围请求无法满足。' },
      { code: 417, phrase: 'Expectation Failed', description: '服务器无法满足 Expect 请求头。' },
      { code: 418, phrase: 'I\'m a teapot', description: '彩蛋状态码。' },
      { code: 421, phrase: 'Misdirected Request', description: '请求被发送到无法产生响应的服务器。' },
      { code: 422, phrase: 'Unprocessable Content', description: '请求格式正确，但语义无法处理。' },
      { code: 423, phrase: 'Locked', description: 'WebDAV 资源被锁定。' },
      { code: 424, phrase: 'Failed Dependency', description: '依赖的请求失败。' },
      { code: 425, phrase: 'Too Early', description: '服务器不愿处理可能被重放的请求。' },
      { code: 426, phrase: 'Upgrade Required', description: '客户端应升级协议。' },
      { code: 428, phrase: 'Precondition Required', description: '服务器要求条件请求。' },
      { code: 429, phrase: 'Too Many Requests', description: '请求过于频繁，触发限流。' },
      { code: 431, phrase: 'Request Header Fields Too Large', description: '请求头字段过大。' },
      { code: 451, phrase: 'Unavailable For Legal Reasons', description: '资源因法律原因不可用。' },
    ],
  },
  {
    label: '5xx 服务端错误',
    range: '500-511',
    codes: [
      { code: 500, phrase: 'Internal Server Error', description: '服务器内部错误。' },
      { code: 501, phrase: 'Not Implemented', description: '服务器不支持完成请求所需的功能。' },
      { code: 502, phrase: 'Bad Gateway', description: '网关或代理从上游收到无效响应。' },
      { code: 503, phrase: 'Service Unavailable', description: '服务暂时不可用。' },
      { code: 504, phrase: 'Gateway Timeout', description: '网关或代理等待上游超时。' },
      { code: 505, phrase: 'HTTP Version Not Supported', description: '服务器不支持请求的 HTTP 版本。' },
      { code: 506, phrase: 'Variant Also Negotiates', description: '服务器存在内容协商配置错误。' },
      { code: 507, phrase: 'Insufficient Storage', description: 'WebDAV 服务器存储空间不足。' },
      { code: 508, phrase: 'Loop Detected', description: 'WebDAV 请求处理中检测到循环。' },
      { code: 510, phrase: 'Not Extended', description: '请求需要进一步扩展。' },
      { code: 511, phrase: 'Network Authentication Required', description: '客户端需要通过网络认证。' },
    ],
  },
]

export const httpStatusCodes = httpStatusGroups.flatMap(group => group.codes)

export function searchHttpStatusCodes(query: string) {
  const keyword = query.trim().toLowerCase()
  if (!keyword) {
    return httpStatusGroups
  }

  return httpStatusGroups
    .map(group => ({
      ...group,
      codes: group.codes.filter(({ code, phrase, description }) =>
        String(code).includes(keyword)
        || phrase.toLowerCase().includes(keyword)
        || description.toLowerCase().includes(keyword),
      ),
    }))
    .filter(group => group.codes.length > 0)
}
