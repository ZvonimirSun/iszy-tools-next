<script setup lang="ts">
import { generateOpenGraphMeta } from './children/openGraphMeta.service'

const form = reactive({
  title: 'ISZY Tools',
  description: 'Handy online tools for developers.',
  url: 'https://example.com/tools',
  image: 'https://example.com/og.png',
  siteName: 'ISZY',
  type: 'website',
  twitterCard: 'summary_large_image',
})
const { copy } = useCopy()

const typeOptions = [
  { label: 'website', value: 'website' },
  { label: 'article', value: 'article' },
  { label: 'profile', value: 'profile' },
  { label: 'video.movie', value: 'video.movie' },
]
const twitterCardOptions = [
  { label: 'summary_large_image', value: 'summary_large_image' },
  { label: 'summary', value: 'summary' },
  { label: 'app', value: 'app' },
  { label: 'player', value: 'player' },
]
const outputText = computed(() => generateOpenGraphMeta(form))
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 md:grid-cols-2">
      <UFormField label="标题">
        <UInput v-model="form.title" class="w-full" />
      </UFormField>
      <UFormField label="站点名称">
        <UInput v-model="form.siteName" class="w-full" />
      </UFormField>
      <UFormField label="描述" class="md:col-span-2">
        <UTextarea v-model="form.description" class="w-full" :rows="3" resize />
      </UFormField>
      <UFormField label="URL">
        <UInput v-model="form.url" class="w-full" />
      </UFormField>
      <UFormField label="图片 URL">
        <UInput v-model="form.image" class="w-full" />
      </UFormField>
      <UFormField label="OG Type">
        <USelect v-model="form.type" :items="typeOptions" class="w-full" />
      </UFormField>
      <UFormField label="Twitter Card">
        <USelect v-model="form.twitterCard" :items="twitterCardOptions" class="w-full" />
      </UFormField>
    </div>

    <ContainerToolItem label="Meta 标签">
      <div class="flex flex-col gap-2">
        <UTextarea :model-value="outputText" class="w-full font-mono" :rows="12" resize readonly />
        <div class="flex justify-end">
          <UButton color="neutral" variant="outline" icon="i-lucide:copy" @click="copy(outputText)">
            复制标签
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
