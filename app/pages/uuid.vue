<script lang="ts" setup>
import { NIL as NIL_UUID, v1 as uuidv1, v4 as uuidv4, v7 as uuidv7 } from 'uuid'

definePageMeta({
  layout: 'full',
})

const toast = useToast()

const formState = ref({
  count: 1,
  version: 'v4',
  hasHyphen: true,
})
const result = ref('')

watch(formState, (val) => {
  if (val.version === 'nil' && val.count !== 1) {
    val.count = 1
  }
}, {
  deep: true,
})

function generate() {
  result.value = ''
  const version = formState.value.version
  const count = formState.value.count
  const hasHyphen = formState.value.hasHyphen
  for (let i = 0; i < count; i++) {
    let tmp = ''
    switch (version) {
      case 'v1': {
        tmp = uuidv1()
        break
      }
      case 'v4': {
        tmp = uuidv4()
        break
      }
      case 'v7': {
        tmp = uuidv7()
        break
      }
      case 'nil': {
        tmp = NIL_UUID
        break
      }
      default:
        break
    }
    if (hasHyphen) {
      result.value += `${tmp}\n`
    }
    else {
      result.value += `${tmp.replaceAll('-', '')}\n`
    }
  }
}

function copy() {
  if (result.value) {
    navigator.clipboard.writeText(result.value)
    toast.add({ title: '复制成功', color: 'success' })
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <ContainerToolItem label="基础信息">
      <UForm class="flex flex-col gap-4">
        <UFormField
          label="版本"
          orientation="horizontal"
          class="grid grid-cols-[3rem_1fr]"
        >
          <USelect
            v-model="formState.version"
            class="max-w-full w-32"
            :items="[
              {
                label: 'Version 1',
                value: 'v1',
              },
              {
                label: 'Version 4',
                value: 'v4',
              },
              {
                label: 'Version 7',
                value: 'v7',
              },
              {
                label: 'NIL',
                value: 'nil',
              },
            ]"
          />
        </UFormField>
        <UFormField
          v-show="formState.version !== 'nil'"
          class="grid grid-cols-[3rem_1fr]"
          label="数量"
          orientation="horizontal"
        >
          <UInputNumber
            v-model="formState.count"
            class="max-w-full w-16"
            orientation="vertical"
            :max="500"
            :min="1"
            :step="1"
          />
        </UFormField>
        <UFormField
          label="连字符"
          orientation="horizontal"
          class="grid grid-cols-[3rem_1fr]"
        >
          <USwitch v-model="formState.hasHyphen" />
        </UFormField>
      </UForm>
    </ContainerToolItem>
    <div class="flex gap-2">
      <UButton
        label="生成"
        @click="generate"
      />
      <UButton
        label="复制"
        @click="copy"
      />
    </div>
    <ContainerToolItem>
      <UTextarea
        v-model="result"
        class="w-full"
        placeholder="结果栏"
        :maxrows="20"
        :rows="10"
        :readonly="true"
      />
    </ContainerToolItem>
    <ContainerToolItem label="常用 UUID 类型">
      <div class="text-sm leading-6 text-muted">
        <p>v1: 基于时间和节点信息，兼容性高。</p>
        <p>v4: 纯随机，最常用。</p>
        <p>v7: 基于 Unix 时间 + 随机，适合按时间排序与数据库索引。</p>
        <p>nil: 全 0 UUID，常用于占位。</p>
      </div>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">
</style>
