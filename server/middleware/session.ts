export default defineEventHandler(async (event) => {
  await setRedisSession(event, await getRedisSession(event))
})
