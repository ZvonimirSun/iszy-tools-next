<script setup lang="ts">
type CidrMode = 'ipv4' | 'ipv6'

interface CidrResult {
  mode: CidrMode
  cidr: string
  inputIp: string
  prefix: number
  rangeStart: string
  rangeEnd: string
  totalAddresses: string
  summaryRows: Array<{ label: string, value: string }>
  detailRows: Array<{ label: string, value: string }>
}

const { copy } = useCopy()

const mode = ref<CidrMode>('ipv4')
const cidrInput = ref('192.168.1.10/24')

const modeItems = [
  { label: 'IPv4', value: 'ipv4' },
  { label: 'IPv6', value: 'ipv6' },
]
const maxIpv6Address = (1n << 128n) - 1n

const parsed = computed(() => {
  try {
    return {
      error: '',
      result: mode.value === 'ipv4'
        ? calculateIpv4Cidr(cidrInput.value)
        : calculateIpv6Cidr(cidrInput.value),
    }
  }
  catch (error) {
    return {
      error: getErrorMessage(error),
      result: undefined,
    }
  }
})
const result = computed(() => parsed.value.result)
const errorMessage = computed(() => parsed.value.error)
const cidrPlaceholder = computed(() => mode.value === 'ipv4' ? '192.168.1.10/24' : '2001:db8::1/64')

const copyText = computed(() => {
  if (!result.value) {
    return ''
  }

  return [
    `CIDR: ${result.value.cidr}`,
    `输入地址: ${result.value.inputIp}`,
    `前缀长度: /${result.value.prefix}`,
    `地址范围: ${result.value.rangeStart} - ${result.value.rangeEnd}`,
    ...result.value.summaryRows.map(row => `${row.label}: ${row.value}`),
    ...result.value.detailRows.map(row => `${row.label}: ${row.value}`),
  ].join('\n')
})

watch(mode, (value) => {
  cidrInput.value = value === 'ipv4' ? '192.168.1.10/24' : '2001:db8::1/64'
})

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function calculateIpv4Cidr(input: string): CidrResult {
  const value = input.trim()
  const matched = /^(.+)\/(\d+)$/.exec(value)
  if (!matched) {
    throw new Error('请输入形如 192.168.1.10/24 的 IPv4 CIDR')
  }

  const ip = parseIpv4(matched[1]!)
  const prefix = Number(matched[2])
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new RangeError('IPv4 CIDR 前缀必须在 0 到 32 之间')
  }

  const mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0
  const wildcard = (~mask) >>> 0
  const network = (ip & mask) >>> 0
  const broadcast = (network | wildcard) >>> 0
  const totalAddresses = 2 ** (32 - prefix)
  const usableAddresses = getIpv4UsableAddressCount(prefix, totalAddresses)
  const firstUsable = getIpv4FirstUsableAddress(prefix, network)
  const lastUsable = getIpv4LastUsableAddress(prefix, network, broadcast)

  return {
    mode: 'ipv4',
    cidr: `${formatIpv4(network)}/${prefix}`,
    inputIp: formatIpv4(ip),
    prefix,
    rangeStart: formatIpv4(firstUsable),
    rangeEnd: formatIpv4(lastUsable),
    totalAddresses: formatDecimal(totalAddresses),
    summaryRows: [
      { label: '网络地址', value: formatIpv4(network) },
      { label: '广播地址', value: formatIpv4(broadcast) },
      { label: '子网掩码', value: formatIpv4(mask) },
      { label: '通配符掩码', value: formatIpv4(wildcard) },
      { label: '可用起始地址', value: formatIpv4(firstUsable) },
      { label: '可用结束地址', value: formatIpv4(lastUsable) },
      { label: '总地址数', value: formatDecimal(totalAddresses) },
      { label: '可用地址数', value: formatDecimal(usableAddresses) },
    ],
    detailRows: [
      { label: '网络地址二进制', value: formatIpv4Binary(network) },
      { label: '子网掩码二进制', value: formatIpv4Binary(mask) },
    ],
  }
}

function calculateIpv6Cidr(input: string): CidrResult {
  const value = input.trim()
  const matched = /^(.+)\/(\d+)$/.exec(value)
  if (!matched) {
    throw new Error('请输入形如 2001:db8::1/64 的 IPv6 CIDR')
  }

  const ip = parseIpv6(matched[1]!)
  const prefix = Number(matched[2])
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128) {
    throw new RangeError('IPv6 CIDR 前缀必须在 0 到 128 之间')
  }

  const mask = getIpv6Mask(prefix)
  const wildcard = maxIpv6Address ^ mask
  const network = ip & mask
  const rangeEnd = network | wildcard
  const totalAddresses = 1n << BigInt(128 - prefix)

  return {
    mode: 'ipv6',
    cidr: `${formatIpv6(network)}/${prefix}`,
    inputIp: formatIpv6(ip),
    prefix,
    rangeStart: formatIpv6(network),
    rangeEnd: formatIpv6(rangeEnd),
    totalAddresses: formatBigInt(totalAddresses),
    summaryRows: [
      { label: '网络地址', value: formatIpv6(network) },
      { label: '起始地址', value: formatIpv6(network) },
      { label: '结束地址', value: formatIpv6(rangeEnd) },
      { label: '总地址数', value: formatBigInt(totalAddresses) },
      { label: '掩码', value: formatIpv6(mask) },
      { label: '通配符掩码', value: formatIpv6(wildcard) },
    ],
    detailRows: [
      { label: '输入地址展开', value: formatIpv6Full(ip) },
      { label: '网络地址展开', value: formatIpv6Full(network) },
      { label: '掩码展开', value: formatIpv6Full(mask) },
    ],
  }
}

function parseIpv4(value: string) {
  const parts = value.trim().split('.')
  if (parts.length !== 4) {
    throw new TypeError('IPv4 地址必须包含 4 段数字')
  }

  return parts.reduce((ip, part) => {
    if (!/^\d+$/.test(part)) {
      throw new TypeError('IPv4 地址只能包含数字和点')
    }

    const octet = Number(part)
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      throw new RangeError('IPv4 每段数字必须在 0 到 255 之间')
    }

    return ((ip << 8) | octet) >>> 0
  }, 0)
}

function parseIpv6(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized.includes(':::')) {
    throw new TypeError('IPv6 地址格式不正确')
  }

  const doubleColonParts = normalized.split('::')
  if (doubleColonParts.length > 2) {
    throw new TypeError('IPv6 地址只能包含一个 :: 压缩段')
  }

  const left = splitIpv6Part(doubleColonParts[0] ?? '')
  const right = splitIpv6Part(doubleColonParts[1] ?? '')
  const missingLength = doubleColonParts.length === 2 ? 8 - left.length - right.length : 0

  if (missingLength < 0 || (doubleColonParts.length === 1 && left.length !== 8)) {
    throw new TypeError('IPv6 地址必须展开为 8 段十六进制数')
  }

  const hextets = [
    ...left,
    ...Array.from<number>({ length: missingLength }).fill(0),
    ...right,
  ]

  if (hextets.length !== 8) {
    throw new TypeError('IPv6 地址必须展开为 8 段十六进制数')
  }

  return hextets.reduce((ip, hextet) => (ip << 16n) | BigInt(hextet), 0n)
}

function splitIpv6Part(value: string) {
  if (!value) {
    return []
  }

  return value.split(':').map((part) => {
    if (!/^[\da-f]{1,4}$/i.test(part)) {
      throw new TypeError('IPv6 每段必须是 1 到 4 位十六进制数')
    }

    return Number.parseInt(part, 16)
  })
}

function getIpv6Mask(prefix: number) {
  if (prefix === 0) {
    return 0n
  }

  return (maxIpv6Address << BigInt(128 - prefix)) & maxIpv6Address
}

function getIpv4UsableAddressCount(prefix: number, totalAddresses: number) {
  if (prefix === 32) {
    return 1
  }

  if (prefix === 31) {
    return 2
  }

  return Math.max(0, totalAddresses - 2)
}

function getIpv4FirstUsableAddress(prefix: number, network: number) {
  if (prefix >= 31) {
    return network
  }

  return (network + 1) >>> 0
}

function getIpv4LastUsableAddress(prefix: number, network: number, broadcast: number) {
  if (prefix === 32) {
    return network
  }

  if (prefix === 31) {
    return broadcast
  }

  return (broadcast - 1) >>> 0
}

function formatIpv4(value: number) {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join('.')
}

function formatIpv4Binary(value: number) {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ]
    .map(octet => octet.toString(2).padStart(8, '0'))
    .join('.')
}

function formatIpv6(value: bigint) {
  const hextets = getIpv6Hextets(value).map(hextet => hextet.toString(16))
  let bestStart = -1
  let bestLength = 0
  let currentStart = -1
  let currentLength = 0

  for (const [index, hextet] of hextets.entries()) {
    if (hextet === '0') {
      if (currentStart === -1) {
        currentStart = index
        currentLength = 1
      }
      else {
        currentLength += 1
      }

      if (currentLength > bestLength) {
        bestStart = currentStart
        bestLength = currentLength
      }
    }
    else {
      currentStart = -1
      currentLength = 0
    }
  }

  if (bestLength < 2) {
    return hextets.join(':')
  }

  const before = hextets.slice(0, bestStart).join(':')
  const after = hextets.slice(bestStart + bestLength).join(':')
  return `${before}::${after}`.replace(/^:/, '::').replace(/:$/, '::')
}

function formatIpv6Full(value: bigint) {
  return getIpv6Hextets(value)
    .map(hextet => hextet.toString(16).padStart(4, '0'))
    .join(':')
}

function getIpv6Hextets(value: bigint) {
  return Array.from({ length: 8 }, (_, index) => {
    const shift = BigInt((7 - index) * 16)
    return Number((value >> shift) & 0xFFFFn)
  })
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function formatBigInt(value: bigint) {
  return new Intl.NumberFormat('zh-CN').format(value)
}
</script>

<template>
  <div class="flex w-full flex-col gap-3">
    <section class="rounded-lg border border-muted bg-muted/20 p-3">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
        <UFormField class="w-full lg:w-36" label="模式">
          <USelect v-model="mode" class="w-full" :items="modeItems" size="xl" />
        </UFormField>
        <div class="min-w-0 flex-1">
          <UFormField label="CIDR">
            <UInput
              v-model="cidrInput"
              class="w-full font-mono"
              size="xl"
              :placeholder="cidrPlaceholder"
              autofocus
            />
          </UFormField>
        </div>
        <UButton
          :disabled="!copyText"
          color="neutral"
          variant="outline"
          icon="i-lucide:copy"
          size="xl"
          @click="copy(copyText)"
        >
          复制结果
        </UButton>
      </div>
    </section>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
      icon="i-lucide:circle-alert"
    />

    <template v-if="result">
      <section class="grid gap-3 lg:grid-cols-4">
        <div class="rounded-lg border border-muted bg-muted/20 p-3">
          <div class="text-xs text-muted">
            规范 CIDR
          </div>
          <div class="mt-1 break-all font-mono text-lg font-semibold text-highlighted">
            {{ result.cidr }}
          </div>
        </div>
        <div class="rounded-lg border border-muted bg-muted/20 p-3">
          <div class="text-xs text-muted">
            输入地址
          </div>
          <div class="mt-1 break-all font-mono text-lg font-semibold text-highlighted">
            {{ result.inputIp }}
          </div>
        </div>
        <div class="rounded-lg border border-muted bg-muted/20 p-3">
          <div class="text-xs text-muted">
            前缀长度
          </div>
          <div class="mt-1 font-mono text-lg font-semibold text-highlighted">
            /{{ result.prefix }}
          </div>
        </div>
        <div class="rounded-lg border border-muted bg-muted/20 p-3">
          <div class="text-xs text-muted">
            地址数量
          </div>
          <div class="mt-1 break-all font-mono text-sm text-highlighted">
            {{ result.totalAddresses }}
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-muted bg-muted/20 p-3">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="row in result.summaryRows"
            :key="row.label"
            class="rounded-md border border-muted bg-default p-3"
          >
            <div class="text-xs text-muted">
              {{ row.label }}
            </div>
            <div class="mt-1 break-all font-mono text-sm text-highlighted">
              {{ row.value }}
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-muted bg-muted/20 p-3">
        <div class="grid gap-3 lg:grid-cols-2">
          <div
            v-for="row in result.detailRows"
            :key="row.label"
            class="rounded-md border border-muted bg-default p-3"
          >
            <div class="text-xs text-muted">
              {{ row.label }}
            </div>
            <div class="mt-1 break-all font-mono text-sm text-highlighted">
              {{ row.value }}
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
