/**
 * 随机字符串
 */
export default function randomString(e?: number, t?: string) {
  e = e || 32
  t = t || 'ABCDEFGHJKMNPQRSTWXYZabcdefghijkmnprstwxyz2345678'
  const a = t.length
  let n = ''
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a))
  return n
}
