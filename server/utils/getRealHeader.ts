import type { H3Event, HTTPHeaderName } from 'h3'

export function getRealHeader(event: H3Event) {
  const originalHeader = getRequestHeaders(event)
  const remoteAddr = getRequestIP(event, { xForwardedFor: true })!
  const xForwardedFor = originalHeader['x-forwarded-for'] ? `${originalHeader['x-forwarded-for']},${remoteAddr}` : remoteAddr
  const ua = originalHeader['user-agent']
  // const referer = originalHeader.referer

  const headers: Partial<Record<HTTPHeaderName, string>> = {
    'x-forwarded-for': xForwardedFor,
    'x-real-ip': remoteAddr,
  }
  if (ua) {
    headers['user-agent'] = ua
  }
  // if (referer) {
  //   headers['x-forwarded-for'] = referer
  // }

  return headers
}
