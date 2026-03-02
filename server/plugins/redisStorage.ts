import redisDriver from 'unstorage/drivers/redis'

export default defineNitroPlugin(() => {
  const storage = useStorage()

  const redisConfig = useRuntimeConfig().redis

  // Dynamically pass in credentials from runtime configuration, or other sources
  const driver = redisDriver({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
  })

  // Mount driver
  storage.mount('redis', driver)
})
