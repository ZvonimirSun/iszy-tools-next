<script setup lang="ts">
import type { ActiveTab, CallDirection, Sex } from './children/relationship.service'
import {
  calculateCallResult,
  calculateRelationChainResult,
  getDisabledSpouseKey,
  getTargetPronoun,
  isActiveTab,
  isSex,
} from './children/relationship.service'

const { copy } = useCopy()

const activeTab = ref<ActiveTab>('call')
const callDirection = ref<CallDirection>('toTarget')
const selfSex = ref<Sex>(1)
const callChain = ref<string[]>([])
const callResult = ref<string[]>([])
const callCalculated = ref(false)
const relationInput = ref('')
const relationResult = ref<string[]>([])
const relationCalculated = ref(false)

const modeItems = [
  { label: '查称呼', value: 'call' },
  { label: '查关系', value: 'relation' },
]

const sexItems = [
  { label: '我是女', value: 0 },
  { label: '我是男', value: 1 },
]

const displayChain = computed(() => {
  if (!callChain.value.length) {
    return '（空）'
  }
  return callChain.value.join('的')
})

const targetPronoun = computed(() => {
  return getTargetPronoun(callChain.value)
})

const titleText = computed(() => {
  return callDirection.value === 'toTarget'
    ? `我称呼${targetPronoun.value}`
    : `${targetPronoun.value}称呼我`
})

const disabledSpouseKey = computed(() => {
  return getDisabledSpouseKey(callChain.value, selfSex.value)
})

const hasCallResult = computed(() => callResult.value.length > 0)
const hasRelationResult = computed(() => relationResult.value.length > 0)

function clearCallState() {
  callCalculated.value = false
  callResult.value = []
}

function clearRelationState() {
  relationCalculated.value = false
  relationResult.value = []
}

function switchTab(nextTab: string | number) {
  if (!isActiveTab(nextTab)) {
    return
  }

  activeTab.value = nextTab
}

function appendRelation(key: string) {
  callChain.value.push(key)
  clearCallState()
}

function backspace() {
  if (!callChain.value.length) {
    return
  }
  callChain.value.pop()
  clearCallState()
}

function resetAll() {
  callChain.value = []
  clearCallState()
}

function swapDirection() {
  callDirection.value = callDirection.value === 'toTarget' ? 'fromTarget' : 'toTarget'
  clearCallState()
}

function setSelfSex(sex: string | number) {
  if (!isSex(sex)) {
    return
  }

  selfSex.value = sex
  clearCallState()
}

function canAppend(key: string) {
  return key !== disabledSpouseKey.value
}

function calculateCall() {
  if (!callChain.value.length) {
    callCalculated.value = true
    callResult.value = []
    return
  }

  callResult.value = calculateCallResult(callChain.value, selfSex.value, callDirection.value)

  callCalculated.value = true
}

function calculateRelation() {
  if (!relationInput.value.trim()) {
    relationCalculated.value = true
    relationResult.value = []
    return
  }

  relationResult.value = calculateRelationChainResult(relationInput.value)

  relationCalculated.value = true
}
</script>

<template>
  <div class="w-full h-full flex justify-center">
    <ContainerToolItem class="w-full max-w-120" label="亲戚关系计算器">
      <div class="flex flex-col gap-4">
        <UTabs
          :model-value="activeTab"
          class="w-full"
          :content="false"
          :items="modeItems"
          @update:model-value="switchTab"
        />

        <template v-if="activeTab === 'call'">
          <div class="flex flex-col gap-2 rounded-lg border border-muted p-3 bg-elevated/30">
            <div class="text-sm font-medium text-toned">
              {{ titleText }}
            </div>

            <div v-if="callCalculated" class="min-h-8">
              <div v-if="hasCallResult" class="flex flex-wrap gap-2">
                <UBadge
                  v-for="item in callResult"
                  :key="item"
                  color="primary"
                  variant="soft"
                  size="lg"
                  class="cursor-pointer"
                  @click="copy(item)"
                >
                  {{ item }}
                </UBadge>
              </div>
              <div v-else class="text-sm text-dimmed">
                未找到对应关系
              </div>
            </div>
            <div v-else class="text-sm text-dimmed min-h-8">
              点击“=”计算结果
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs text-toned">关系链</span>
            <UInput
              :model-value="displayChain"
              readonly
              class="w-full"
            />
          </div>

          <UTabs
            :model-value="selfSex"
            class="w-full"
            :content="false"
            :items="sexItems"
            @update:model-value="setSelfSex"
          />

          <div class="grid grid-cols-4 grid-rows-4 gap-2">
            <UButton class="h-14 text-lg" variant="soft" color="neutral" @click="appendRelation('父')">
              父
            </UButton>
            <UButton class="h-14 text-lg" variant="soft" color="neutral" @click="appendRelation('母')">
              母
            </UButton>
            <UButton class="h-14" variant="soft" color="neutral" icon="i-lucide:delete" aria-label="退格" @click="backspace" />
            <UButton class="h-14" variant="soft" color="warning" icon="i-lucide:rotate-ccw" aria-label="重置" @click="resetAll" />

            <UButton class="h-14 text-lg" variant="soft" color="neutral" @click="appendRelation('兄')">
              兄
            </UButton>
            <UButton class="h-14 text-lg" variant="soft" color="neutral" @click="appendRelation('姐')">
              姐
            </UButton>
            <UButton class="h-14 text-lg" variant="soft" color="neutral" :disabled="!canAppend('夫')" @click="appendRelation('夫')">
              夫
            </UButton>
            <UButton class="h-14 text-lg" variant="soft" color="neutral" :disabled="!canAppend('妻')" @click="appendRelation('妻')">
              妻
            </UButton>

            <UButton class="h-14 text-lg" variant="soft" color="neutral" @click="appendRelation('弟')">
              弟
            </UButton>
            <UButton class="h-14 text-lg" variant="soft" color="neutral" @click="appendRelation('妹')">
              妹
            </UButton>
            <UButton class="h-14" variant="soft" color="info" icon="i-lucide:arrow-right-left" aria-label="交换称呼方向" @click="swapDirection" />
            <UButton class="row-span-2 h-full text-2xl" color="primary" @click="calculateCall">
              =
            </UButton>

            <UButton class="h-14 text-lg" variant="soft" color="neutral" @click="appendRelation('子')">
              子
            </UButton>
            <UButton class="h-14 text-lg" variant="soft" color="neutral" @click="appendRelation('女')">
              女
            </UButton>
            <UPopover>
              <UButton class="h-14" variant="soft" color="info" icon="i-lucide:circle-help" aria-label="帮助" />
              <template #content>
                <div class="p-3 text-sm leading-6 max-w-64">
                  <p>退格：删除关系链的最后一级。</p>
                  <p>交换：只切换“我称呼TA / TA称呼我”。</p>
                  <p>重置：清空关系链与当前结果。</p>
                </div>
              </template>
            </UPopover>
          </div>
        </template>

        <template v-else>
          <div class="flex flex-col gap-2 rounded-lg border border-muted p-3 bg-elevated/30">
            <div class="text-sm font-medium text-toned">
              关系链结果
            </div>

            <div v-if="relationCalculated" class="min-h-8">
              <div v-if="hasRelationResult" class="flex flex-col gap-2">
                <div
                  v-for="item in relationResult"
                  :key="item"
                  class="rounded-md border border-muted px-3 py-2 text-sm cursor-pointer hover:bg-elevated/50"
                  @click="copy(item)"
                >
                  {{ item }}
                </div>
              </div>
              <div v-else class="text-sm text-dimmed">
                未找到对应关系链
              </div>
            </div>
            <div v-else class="text-sm text-dimmed min-h-8">
              输入称呼后点击“计算”查看关系链
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs text-toned">手动输入称呼</span>
            <UInput
              v-model="relationInput"
              class="w-full"
              placeholder="例如：奶奶、叔叔的儿子、妈妈的妈妈"
            >
              <template v-if="relationInput" #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-lucide:x"
                  aria-label="清空输入"
                  @click="relationInput = ''; clearRelationState()"
                />
              </template>
            </UInput>
          </div>

          <div class="flex justify-center">
            <UButton color="primary" size="lg" @click="calculateRelation">
              计算
            </UButton>
          </div>
        </template>
      </div>
    </ContainerToolItem>
  </div>
</template>
