<script setup lang="ts">
const TABLE = 'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF'
const POSITIONS = [11, 10, 3, 8, 4, 6] as const
const XOR = 177451812
const ADD = 8728348608
const BASE = 58
const BV_TEMPLATE = ['B', 'V', '1', ' ', ' ', '4', ' ', '1', ' ', '7', ' ', ' ']
const SPACES_REGEX = /\s+/g
const AID_PREFIX_REGEX = /^av/
const DIGITS_REGEX = /^\d+$/
const BVID_EXTRACT_REGEX = /BV[0-9A-Z]{10}/i
const BVID_PREFIX_REGEX = /^bv/i

const charToIndex: Record<string, number> = {}
for (let i = 0; i < TABLE.length; i++) {
  charToIndex[TABLE[i]!] = i
}

const aid = ref('19390801')
const bvid = ref('')
const errorMessage = ref('')
const isSyncing = ref(false)
const { copy } = useCopy()

function parseAidInput(input: string) {
  const normalized = input.trim().replace(SPACES_REGEX, '').toLowerCase().replace(AID_PREFIX_REGEX, '')
  if (!normalized || !DIGITS_REGEX.test(normalized)) {
    return null
  }
  const value = Number.parseInt(normalized, 10)
  return Number.isSafeInteger(value) && value > 0 ? value : null
}

function parseBvidInput(input: string) {
  const matched = input.match(BVID_EXTRACT_REGEX)
  if (matched?.[0]) {
    return `BV${matched[0].slice(2)}`
  }

  const normalized = input.trim().replace(SPACES_REGEX, '')
  if (!normalized) {
    return ''
  }

  if (BVID_PREFIX_REGEX.test(normalized)) {
    return `BV${normalized.slice(2)}`
  }

  return `BV${normalized}`
}

function encodeAidToBvid(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    return null
  }

  const result = [...BV_TEMPLATE]
  const encoded = (value ^ XOR) + ADD
  for (let i = 0; i < POSITIONS.length; i++) {
    const index = Math.floor(encoded / BASE ** i) % BASE
    result[POSITIONS[i]!] = TABLE[index]!
  }
  return result.join('')
}

function decodeBvidToAid(value: string) {
  if (value.length !== 12) {
    return null
  }

  let result = 0
  for (let i = 0; i < POSITIONS.length; i++) {
    const char = value[POSITIONS[i]!]!
    const index = charToIndex[char]
    if (index === undefined) {
      return null
    }
    result += index * BASE ** i
  }

  const decoded = (result - ADD) ^ XOR
  return Number.isSafeInteger(decoded) && decoded > 0 ? decoded : null
}

function syncFromAid() {
  const parsedAid = parseAidInput(aid.value)
  if (!aid.value.trim()) {
    bvid.value = ''
    errorMessage.value = ''
    return
  }

  if (parsedAid === null) {
    bvid.value = ''
    errorMessage.value = '请输入合法的 AV 号（例如 av170001）'
    return
  }

  const encoded = encodeAidToBvid(parsedAid)
  if (!encoded) {
    bvid.value = ''
    errorMessage.value = 'AV 号超出可转换范围'
    return
  }

  bvid.value = encoded
  errorMessage.value = ''
}

function syncFromBvid() {
  const normalizedBvid = parseBvidInput(bvid.value)
  if (!bvid.value.trim()) {
    aid.value = ''
    errorMessage.value = ''
    return
  }

  if (!normalizedBvid) {
    aid.value = ''
    errorMessage.value = '请输入合法的 BV 号（例如 BV17x411w7KC）'
    return
  }

  const decoded = decodeBvidToAid(normalizedBvid)
  if (decoded === null) {
    aid.value = ''
    errorMessage.value = '请输入合法的 BV 号（例如 BV17x411w7KC）'
    return
  }

  aid.value = `${decoded}`
  bvid.value = normalizedBvid
  errorMessage.value = ''
}

watch(aid, () => {
  if (isSyncing.value) {
    return
  }
  isSyncing.value = true
  syncFromAid()
  isSyncing.value = false
})

watch(bvid, () => {
  if (isSyncing.value) {
    return
  }
  isSyncing.value = true
  syncFromBvid()
  isSyncing.value = false
})

const avLink = computed(() => {
  const parsedAid = parseAidInput(aid.value)
  return parsedAid ? `https://www.bilibili.com/video/av${parsedAid}` : ''
})

const bvLink = computed(() => {
  const normalizedBvid = parseBvidInput(bvid.value)
  const decoded = normalizedBvid ? decodeBvidToAid(normalizedBvid) : null
  return decoded ? `https://www.bilibili.com/video/${normalizedBvid}` : ''
})

onMounted(() => {
  syncFromAid()
})
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <ContainerToolItem label="BV / AV 转换" content-class="flex flex-col gap-4">
      <p class="text-sm text-toned">
        实时计算，输入 AV 号或 BV 号即可自动转换。
      </p>

      <UForm class="flex flex-col gap-3">
        <UFormField label="AV 号" orientation="horizontal" class="grid grid-cols-[4rem_1fr]">
          <UInput
            v-model="aid"
            class="w-full"
            placeholder="例如 av170001 或 170001"
          />
        </UFormField>

        <UFormField label="BV 号" orientation="horizontal" class="grid grid-cols-[4rem_1fr]">
          <UInput
            v-model="bvid"
            class="w-full"
            placeholder="例如 BV17x411w7KC"
          />
        </UFormField>
      </UForm>

      <UAlert
        v-if="errorMessage"
        color="error"
        icon="i-lucide:circle-alert"
        :title="errorMessage"
      />
    </ContainerToolItem>

    <ContainerToolItem label="链接信息" content-class="flex flex-col gap-3">
      <UFormField label="AV 链接" orientation="horizontal" class="grid grid-cols-[4rem_1fr] gap-2 items-start">
        <div class="flex flex-col gap-2 w-full">
          <UInput :model-value="avLink" readonly class="w-full" placeholder="转换成功后显示" />
          <div class="flex gap-2">
            <UButton
              :disabled="!avLink"
              color="neutral"
              variant="outline"
              icon="i-lucide:copy"
              @click="copy(avLink)"
            >
              复制
            </UButton>
            <UButton
              :disabled="!avLink"
              color="neutral"
              variant="ghost"
              icon="i-lucide:external-link"
              :to="avLink"
              target="_blank"
            >
              打开
            </UButton>
          </div>
        </div>
      </UFormField>

      <UFormField label="BV 链接" orientation="horizontal" class="grid grid-cols-[4rem_1fr] gap-2 items-start">
        <div class="flex flex-col gap-2 w-full">
          <UInput :model-value="bvLink" readonly class="w-full" placeholder="转换成功后显示" />
          <div class="flex gap-2">
            <UButton
              :disabled="!bvLink"
              color="neutral"
              variant="outline"
              icon="i-lucide:copy"
              @click="copy(bvLink)"
            >
              复制
            </UButton>
            <UButton
              :disabled="!bvLink"
              color="neutral"
              variant="ghost"
              icon="i-lucide:external-link"
              :to="bvLink"
              target="_blank"
            >
              打开
            </UButton>
          </div>
        </div>
      </UFormField>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
