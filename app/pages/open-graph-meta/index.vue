<script setup lang="ts">
import {
  createDefaultOpenGraphMetaInput,
  generateOpenGraphMeta,
  getOpenGraphSections,
  openGraphTypeOptions,
  twitterCardOptions,
} from './children/openGraphMeta.service'

const form = reactive(createDefaultOpenGraphMetaInput())
const { copy } = useCopy()

const sections = computed(() => getOpenGraphSections(form.type))
const outputText = computed(() => generateOpenGraphMeta(form))
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-4">
    <section class="rounded-lg border border-muted bg-muted/30 p-4">
      <h2 class="mb-4 text-base font-semibold">
        类型
      </h2>
      <div class="grid gap-3 md:grid-cols-2">
        <UFormField label="OG Type">
          <USelect v-model="form.type" :items="openGraphTypeOptions" class="w-full" />
        </UFormField>
        <UFormField label="Twitter Card">
          <USelect v-model="form['twitter:card']" :items="twitterCardOptions" class="w-full" />
        </UFormField>
      </div>
    </section>

    <section
      v-for="section in sections"
      :key="section.title"
      class="rounded-lg border border-muted bg-muted/30 p-4"
    >
      <h2 class="mb-4 text-base font-semibold">
        {{ section.title }}
      </h2>
      <div class="grid gap-3 md:grid-cols-2">
        <UFormField
          v-for="field in section.fields"
          :key="field.key"
          :label="field.label"
          :help="field.list ? '多个值用英文逗号分隔' : undefined"
        >
          <UInput
            v-model="form[field.key]"
            class="w-full"
            :placeholder="field.placeholder"
            :type="field.numeric ? 'number' : 'text'"
          />
        </UFormField>
      </div>
    </section>

    <ContainerToolItem label="Meta 标签">
      <div class="flex flex-col gap-2">
        <UTextarea :model-value="outputText" class="w-full font-mono" :rows="16" resize readonly />
        <div class="flex justify-end">
          <UButton color="neutral" variant="outline" icon="i-lucide:copy" @click="copy(outputText)">
            复制标签
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
