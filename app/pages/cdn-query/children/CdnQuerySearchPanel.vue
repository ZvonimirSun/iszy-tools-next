<script setup lang="ts">
defineProps<{
  keyword: string
  loading: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  'search': []
  'update:keyword': [value: string]
}>()
</script>

<template>
  <ContainerToolItem label="前端 CDN 搜索">
    <div class="flex flex-col gap-3">
      <UAlert
        color="info"
        variant="soft"
        icon="i-lucide:database"
        title="数据来源：jsDelivr + Algolia"
        description="支持库名搜索，也支持 author:xxx 过滤语法。"
      />

      <div class="flex gap-2">
        <UInput
          :model-value="keyword"
          class="flex-1"
          placeholder="输入库名，例如 jquery 或 author:vuejs"
          @update:model-value="emit('update:keyword', $event)"
          @keyup.enter="emit('search')"
        />
        <UButton
          icon="i-lucide:search"
          :loading="loading"
          @click="emit('search')"
        >
          搜索
        </UButton>
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide:circle-alert"
        :title="errorMessage"
      />
    </div>
  </ContainerToolItem>
</template>
