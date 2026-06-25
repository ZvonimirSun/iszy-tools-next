<script setup lang="ts">
import { stringify as stringifyYaml } from 'yaml'
import { downloadBlob } from '~/utils/common'

interface ComposeService {
  image?: string
  container_name?: string
  restart?: string
  ports?: string[]
  environment?: Record<string, string>
  env_file?: string[]
  volumes?: string[]
  networks?: string[]
  hostname?: string
  user?: string
  working_dir?: string
  entrypoint?: string
  command?: string
  privileged?: boolean
  dns?: string[]
  extra_hosts?: string[]
}

const dockerRunInput = ref('docker run -d --name nginx-demo -p 8080:80 -e NGINX_HOST=localhost -v ./html:/usr/share/nginx/html:ro --restart unless-stopped nginx:alpine')
const { copy } = useCopy()

const parsedCompose = computed(() => {
  try {
    const parsed = parseDockerRun(dockerRunInput.value)
    return {
      error: '',
      output: stringifyYaml({
        services: {
          [parsed.serviceName]: parsed.service,
        },
      }, {
        indent: 2,
        lineWidth: 0,
      }).trimEnd(),
    }
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      output: '',
    }
  }
})
const composeOutput = computed(() => parsedCompose.value.output)
const errorMessage = computed(() => parsedCompose.value.error)

function tokenizeShell(command: string) {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | '\'' | '' = ''
  let escaping = false

  for (const char of command.trim()) {
    if (escaping) {
      current += char
      escaping = false
      continue
    }

    if (char === '\\' && quote !== '\'') {
      escaping = true
      continue
    }

    if ((char === '"' || char === '\'') && (!quote || quote === char)) {
      quote = quote ? '' : char
      continue
    }

    if (/\s/.test(char) && !quote) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (quote)
    throw new Error('命令中的引号未闭合')

  if (current)
    tokens.push(current)

  return tokens
}

function readFlagValue(tokens: string[], index: number, flag: string) {
  const token = tokens[index] ?? ''
  const inlinePrefix = `${flag}=`
  if (token.startsWith(inlinePrefix))
    return { value: token.slice(inlinePrefix.length), nextIndex: index + 1 }

  const value = tokens[index + 1]
  if (!value)
    throw new Error(`${flag} 缺少参数值`)

  return { value, nextIndex: index + 2 }
}

function appendRecordValue(target: Record<string, string>, value: string) {
  const equalIndex = value.indexOf('=')
  if (equalIndex === -1) {
    target[value] = ''
    return
  }

  target[value.slice(0, equalIndex)] = value.slice(equalIndex + 1)
}

function toServiceName(value: string) {
  const name = value.split('/').pop()?.split(':')[0] || 'app'
  return name.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'app'
}

function parseDockerRun(command: string) {
  const tokens = tokenizeShell(command)
  const runIndex = tokens.findIndex((token, index) => token === 'run' && tokens[index - 1] === 'docker')
  const args = runIndex === -1 ? tokens : tokens.slice(runIndex + 1)
  const service: ComposeService = {}
  const environment: Record<string, string> = {}
  const ports: string[] = []
  const volumes: string[] = []
  const envFile: string[] = []
  const networks: string[] = []
  const dns: string[] = []
  const extraHosts: string[] = []

  let image = ''
  let commandArgs: string[] = []
  let index = 0

  while (index < args.length) {
    const token = args[index]!

    if (!token.startsWith('-')) {
      image = token
      commandArgs = args.slice(index + 1)
      break
    }

    if (['-d', '--detach', '--rm', '-it', '-i', '-t'].includes(token)) {
      index += 1
      continue
    }

    if (token === '--privileged') {
      service.privileged = true
      index += 1
      continue
    }

    if (token === '--name') {
      const result = readFlagValue(args, index, '--name')
      service.container_name = result.value
      index = result.nextIndex
      continue
    }

    if (token === '-p' || token === '--publish' || token.startsWith('--publish=')) {
      const result = readFlagValue(args, index, token.startsWith('--publish=') ? '--publish' : token)
      ports.push(result.value)
      index = result.nextIndex
      continue
    }

    if (token === '-e' || token === '--env' || token.startsWith('--env=')) {
      const result = readFlagValue(args, index, token.startsWith('--env=') ? '--env' : token)
      appendRecordValue(environment, result.value)
      index = result.nextIndex
      continue
    }

    if (token === '-v' || token === '--volume' || token.startsWith('--volume=')) {
      const result = readFlagValue(args, index, token.startsWith('--volume=') ? '--volume' : token)
      volumes.push(result.value)
      index = result.nextIndex
      continue
    }

    if (token === '--env-file' || token.startsWith('--env-file=')) {
      const result = readFlagValue(args, index, token.startsWith('--env-file=') ? '--env-file' : token)
      envFile.push(result.value)
      index = result.nextIndex
      continue
    }

    if (token === '--restart' || token.startsWith('--restart=')) {
      const result = readFlagValue(args, index, token.startsWith('--restart=') ? '--restart' : token)
      service.restart = result.value
      index = result.nextIndex
      continue
    }

    if (token === '--network' || token.startsWith('--network=')) {
      const result = readFlagValue(args, index, token.startsWith('--network=') ? '--network' : token)
      networks.push(result.value)
      index = result.nextIndex
      continue
    }

    if (token === '--hostname' || token.startsWith('--hostname=')) {
      const result = readFlagValue(args, index, token.startsWith('--hostname=') ? '--hostname' : token)
      service.hostname = result.value
      index = result.nextIndex
      continue
    }

    if (token === '--user' || token === '-u' || token.startsWith('--user=')) {
      const result = readFlagValue(args, index, token.startsWith('--user=') ? '--user' : token)
      service.user = result.value
      index = result.nextIndex
      continue
    }

    if (token === '--workdir' || token === '-w' || token.startsWith('--workdir=')) {
      const result = readFlagValue(args, index, token.startsWith('--workdir=') ? '--workdir' : token)
      service.working_dir = result.value
      index = result.nextIndex
      continue
    }

    if (token === '--entrypoint' || token.startsWith('--entrypoint=')) {
      const result = readFlagValue(args, index, token.startsWith('--entrypoint=') ? '--entrypoint' : token)
      service.entrypoint = result.value
      index = result.nextIndex
      continue
    }

    if (token === '--dns' || token.startsWith('--dns=')) {
      const result = readFlagValue(args, index, token.startsWith('--dns=') ? '--dns' : token)
      dns.push(result.value)
      index = result.nextIndex
      continue
    }

    if (token === '--add-host' || token.startsWith('--add-host=')) {
      const result = readFlagValue(args, index, token.startsWith('--add-host=') ? '--add-host' : token)
      extraHosts.push(result.value)
      index = result.nextIndex
      continue
    }

    index += token.includes('=') ? 1 : 2
  }

  if (!image)
    throw new Error('未识别到镜像名称，请输入 docker run 命令')

  service.image = image
  if (ports.length)
    service.ports = ports
  if (Object.keys(environment).length)
    service.environment = environment
  if (envFile.length)
    service.env_file = envFile
  if (volumes.length)
    service.volumes = volumes
  if (networks.length)
    service.networks = networks
  if (dns.length)
    service.dns = dns
  if (extraHosts.length)
    service.extra_hosts = extraHosts
  if (commandArgs.length)
    service.command = commandArgs.join(' ')

  return {
    serviceName: toServiceName(service.container_name || image),
    service,
  }
}

function clear() {
  dockerRunInput.value = ''
}

function downloadCompose() {
  if (!composeOutput.value)
    return

  const blob = new Blob([composeOutput.value], { type: 'application/yaml;charset=utf-8' })
  downloadBlob(blob, 'docker-compose.yml')
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />

    <div class="grid gap-4 xl:grid-cols-2">
      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            Docker Run 命令
          </h2>
          <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" size="sm" @click="clear">
            清空
          </UButton>
        </div>
        <UTextarea
          v-model="dockerRunInput"
          class="w-full font-mono"
          :rows="18"
          resize
          autofocus
          placeholder="粘贴 docker run 命令..."
        />
      </section>

      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-medium text-highlighted">
            Docker Compose
          </h2>
          <div class="flex gap-2">
            <UButton
              :disabled="!composeOutput"
              color="neutral"
              variant="outline"
              icon="i-lucide:copy"
              size="sm"
              @click="copy(composeOutput)"
            >
              复制
            </UButton>
            <UButton
              :disabled="!composeOutput"
              color="primary"
              variant="soft"
              icon="i-lucide:download"
              size="sm"
              @click="downloadCompose"
            >
              下载
            </UButton>
          </div>
        </div>
        <UTextarea
          :model-value="composeOutput"
          class="w-full font-mono"
          :rows="18"
          resize
          readonly
          placeholder="转换结果将显示在这里..."
        />
      </section>
    </div>
  </div>
</template>
