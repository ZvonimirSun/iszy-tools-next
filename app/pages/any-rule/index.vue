<script setup lang="ts">
import type { AnyRuleExample, AnyRuleItem } from './children/anyRule.data'
import { anyRuleItems } from './children/anyRule.data'

const SOURCE_URL = 'https://any86.github.io/any-rule/'
const FEEDBACK_URL_PREFIX = 'https://github.com/any86/any-rule/issues/new?title='

const { copy } = useCopy()

const keyword = ref('')
const model = reactive<Record<string, string>>(
  Object.fromEntries(anyRuleItems.map(item => [item.key, ''])),
)

function exampleToText(example: AnyRuleExample) {
  return `${example}`
}

const searchIndex = new Map(
  anyRuleItems.map((item) => {
    const values = [
      item.title,
      item.ruleText,
      ...item.examples.map(exampleToText),
      ...(item.counterExamples?.map(exampleToText) ?? []),
    ]

    return [item.key, values.join(' ').toLowerCase()]
  }),
)

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())

const filteredRules = computed(() => {
  if (!normalizedKeyword.value) {
    return anyRuleItems
  }

  return anyRuleItems.filter(item => searchIndex.get(item.key)?.includes(normalizedKeyword.value))
})

function buildPlaceholder(item: AnyRuleItem) {
  const exampleText = item.examples.map(exampleToText).join('、')
  const parts = [`例如：${exampleText}`]

  if (item.counterExamples?.length) {
    parts.push(`反例：${item.counterExamples.map(exampleToText).join('、')}`)
  }

  return parts.join('；')
}

function getFeedbackUrl(title: string) {
  return `${FEEDBACK_URL_PREFIX}${encodeURIComponent(`我有更好的正则: ${title}`)}`
}

function getInputValue(key: string) {
  return model[key] ?? ''
}

function getMatchState(item: AnyRuleItem) {
  const value = getInputValue(item.key)
  if (!value) {
    return null
  }

  item.rule.lastIndex = 0
  return item.rule.test(value)
}

function getStateMeta(item: AnyRuleItem) {
  const state = getMatchState(item)

  if (state === null) {
    return {
      badgeColor: 'neutral' as const,
      badgeLabel: '待测试',
      alertColor: 'neutral' as const,
      alertIcon: 'i-lucide:circle-help',
      alertTitle: '输入任意内容后将立即校验；也可以点击下方示例或反例快速填充。',
    }
  }

  if (state) {
    return {
      badgeColor: 'success' as const,
      badgeLabel: '匹配通过',
      alertColor: 'success' as const,
      alertIcon: 'i-lucide:badge-check',
      alertTitle: '当前输入符合该正则规则。',
    }
  }

  return {
    badgeColor: 'error' as const,
    badgeLabel: '不通过',
    alertColor: 'error' as const,
    alertIcon: 'i-lucide:circle-alert',
    alertTitle: '当前输入不符合该正则规则。',
  }
}

function fillExample(item: AnyRuleItem, example: AnyRuleExample) {
  model[item.key] = exampleToText(example)
}

function clearRuleInput(key: string) {
  model[key] = ''
}

function clearSearch() {
  keyword.value = ''
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4 overflow-auto">
    <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
      <span>数据来源：</span>
      <UButton
        :href="SOURCE_URL"
        target="_blank"
        color="neutral"
        size="xs"
        variant="link"
      >
        any86/any-rule
      </UButton>
    </div>

    <ContainerToolItem label="筛选规则" content-class="flex flex-col gap-3">
      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <UFormField label="关键词">
          <UInput
            v-model.trim="keyword"
            class="w-full"
            icon="i-lucide:search"
            placeholder="支持按标题、正则本体、示例文本搜索，例如：手机、IPv6、邮箱"
            autofocus
          />
        </UFormField>

        <div class="flex flex-wrap items-center gap-2 lg:justify-end">
          <UBadge color="neutral" variant="subtle">
            共 {{ filteredRules.length }} / {{ anyRuleItems.length }} 条
          </UBadge>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide:eraser"
            :disabled="!keyword"
            @click="clearSearch"
          >
            清空搜索
          </UButton>
        </div>
      </div>
    </ContainerToolItem>

    <UAlert
      v-if="!filteredRules.length"
      color="warning"
      variant="soft"
      icon="i-lucide:search-x"
      title="未找到匹配规则，请尝试调整关键词。"
    />

    <ContainerToolItem
      v-for="item in filteredRules"
      :key="item.key"
      :label="item.title"
      content-class="flex flex-col gap-4"
    >
      <div class="flex flex-wrap items-center gap-2">
        <UBadge :color="getStateMeta(item).badgeColor" variant="subtle">
          {{ getStateMeta(item).badgeLabel }}
        </UBadge>
        <UButton
          :href="getFeedbackUrl(item.title)"
          target="_blank"
          color="neutral"
          size="xs"
          variant="link"
          icon="i-lucide:message-square-warning"
        >
          反馈规则
        </UButton>
      </div>

      <UFormField label="输入测试">
        <UInput
          v-model="model[item.key]"
          class="w-full"
          :placeholder="buildPlaceholder(item)"
        />
      </UFormField>

      <UAlert
        :color="getStateMeta(item).alertColor"
        variant="soft"
        :icon="getStateMeta(item).alertIcon"
        :title="getStateMeta(item).alertTitle"
      />

      <div class="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div class="flex flex-col gap-3">
          <UFormField label="正则表达式">
            <UTextarea
              :model-value="item.ruleText"
              class="w-full font-mono"
              :rows="item.ruleText.length > 180 ? 6 : 3"
              resize
              readonly
            />
          </UFormField>

          <div class="flex flex-wrap justify-end gap-2">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide:copy"
              @click="copy(item.ruleText)"
            >
              复制正则
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide:trash-2"
              :disabled="!getInputValue(item.key)"
              @click="clearRuleInput(item.key)"
            >
              清空测试
            </UButton>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-2">
            <span class="text-sm text-toned">匹配示例</span>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="example in item.examples"
                :key="`${item.key}-example-${example}`"
                color="primary"
                variant="soft"
                size="xs"
                class="max-w-full"
                @click="fillExample(item, example)"
              >
                <span class="max-w-80 truncate">{{ exampleToText(example) }}</span>
              </UButton>
            </div>
          </div>

          <div v-if="item.counterExamples?.length" class="flex flex-col gap-2">
            <span class="text-sm text-toned">反例</span>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="example in item.counterExamples"
                :key="`${item.key}-counter-${example}`"
                color="warning"
                variant="soft"
                size="xs"
                class="max-w-full"
                @click="fillExample(item, example)"
              >
                <span class="max-w-80 truncate">{{ exampleToText(example) }}</span>
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
