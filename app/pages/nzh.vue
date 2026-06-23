<script setup lang="ts">
import Nzh from 'nzh'

const num = ref('')

const s = computed({
  get: () => {
    try {
      return num.value ? Nzh.cn.encodeS(num.value) : ''
    }
    catch {
      return ''
    }
  },
  set: (val: string) => {
    try {
      num.value = val ? Nzh.cn.decodeS(val) : ''
    }
    catch {}
  },
})

const b = computed({
  get: () => {
    try {
      return num.value ? Nzh.cn.encodeB(num.value) : ''
    }
    catch {
      return ''
    }
  },
  set: (val: string) => {
    try {
      num.value = val ? Nzh.cn.decodeB(val) : ''
    }
    catch {}
  },
})

const money = computed(() => {
  try {
    return num.value ? Nzh.cn.toMoney(num.value) : ''
  }
  catch {
    return ''
  }
})

const { copy } = useCopy()
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <UAlert
      icon="i-lucide:info"
      color="info"
      variant="soft"
      title="在任意输入框中输入内容，其余字段将自动转换"
    />

    <ContainerToolItem label="数字中文转换">
      <div class="flex flex-col gap-4">
        <!-- 小写数字 -->
        <div class="grid grid-cols-[6rem_1fr] items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm font-medium text-toned">
            <UIcon name="i-lucide:hash" class="size-4 shrink-0 text-primary" />
            <span>小写数字</span>
          </div>
          <UInput v-model="num" class="w-full" placeholder="请输入阿拉伯数字，如 1234567.89">
            <template #trailing>
              <UTooltip text="复制到剪贴板" :content="{ side: 'left' }">
                <UButton
                  :disabled="!num"
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-lucide:copy"
                  aria-label="复制"
                  @click="copy(num)"
                />
              </UTooltip>
            </template>
          </UInput>
        </div>

        <USeparator />

        <!-- 中文小写 -->
        <div class="grid grid-cols-[6rem_1fr] items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm font-medium text-toned">
            <UIcon name="i-lucide:type" class="size-4 shrink-0 text-primary" />
            <span>中文小写</span>
          </div>
          <UInput v-model="s" class="w-full" placeholder="如 一百二十三万四千五百六十七">
            <template #trailing>
              <UTooltip text="复制到剪贴板" :content="{ side: 'left' }">
                <UButton
                  :disabled="!s"
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-lucide:copy"
                  aria-label="复制"
                  @click="copy(s)"
                />
              </UTooltip>
            </template>
          </UInput>
        </div>

        <!-- 中文大写 -->
        <div class="grid grid-cols-[6rem_1fr] items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm font-medium text-toned">
            <UIcon name="i-lucide:whole-word" class="size-4 shrink-0 text-primary" />
            <span>中文大写</span>
          </div>
          <UInput v-model="b" class="w-full" placeholder="如 壹佰贰拾叁万肆仟伍佰陆拾柒">
            <template #trailing>
              <UTooltip text="复制到剪贴板" :content="{ side: 'left' }">
                <UButton
                  :disabled="!b"
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-lucide:copy"
                  aria-label="复制"
                  @click="copy(b)"
                />
              </UTooltip>
            </template>
          </UInput>
        </div>

        <USeparator />

        <!-- 中文金额 -->
        <div class="grid grid-cols-[6rem_1fr] items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm font-medium text-toned">
            <UIcon name="i-lucide:banknote" class="size-4 shrink-0 text-primary" />
            <span>中文金额</span>
          </div>
          <UInput :model-value="money" class="w-full" readonly placeholder="由以上数字自动生成">
            <template #trailing>
              <UTooltip text="复制到剪贴板" :content="{ side: 'left' }">
                <UButton
                  :disabled="!money"
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-lucide:copy"
                  aria-label="复制"
                  @click="copy(money)"
                />
              </UTooltip>
            </template>
          </UInput>
        </div>
      </div>
    </ContainerToolItem>

    <div class="flex gap-2">
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide:trash-2"
        :disabled="!num"
        @click="num = ''"
      >
        清空
      </UButton>
    </div>
  </div>
</template>

<style scoped>
</style>
