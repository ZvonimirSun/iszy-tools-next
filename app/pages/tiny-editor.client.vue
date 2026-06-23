<script setup lang="ts">
import css from '~/components/editor/lang-css'
import html from '~/components/editor/lang-html'
import js from '~/components/editor/lang-js'

const store = useTinyEditorStore()

const doc = computed(() => {
  if (store.html + store.css + store.js === '') {
    return '输入内容以在此展示'
  }
  else {
    return `${store.html}<style>${store.css}<\/style><script>${store.js}<\/script>`
  }
})

const fullScreenStatus = ref(false)

function fullScreen() {
  fullScreenStatus.value = !fullScreenStatus.value
}
function openNew() {
  const blob = new Blob([doc.value], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="panel w-full h-full flex flex-wrap overflow-auto">
    <EditorMini
      v-show="!fullScreenStatus"
      class="border border-accented w-full sm:w-1/2 h-2/3 sm:h-1/2"
      placeholder="请输入HTML内容"
      :plugin="html"
      :input-default="store.html"
      @change="store.html = $event"
    />
    <EditorMini
      v-show="!fullScreenStatus"
      class="border border-accented w-full sm:w-1/2 h-2/3 sm:h-1/2"
      placeholder="请输入JS内容"
      :plugin="js"
      :input-default="store.js"
      @change="store.js = $event"
    />
    <EditorMini
      v-show="!fullScreenStatus"
      class="border border-accented w-full sm:w-1/2 h-2/3 sm:h-1/2"
      placeholder="请输入CSS内容"
      :plugin="css"
      :input-default="store.css"
      @change="store.css = $event"
    />
    <div
      class="border border-accented w-full sm:w-1/2 h-2/3 sm:h-1/2 relative [&.full-panel]:w-full [&.full-panel]:h-full"
      :class="{
        'full-panel': fullScreenStatus,
      }"
    >
      <div class="flex gap-1 absolute right-1 top-1">
        <UTooltip
          v-if="fullScreenStatus"
          text="退出完整展示"
        >
          <UButton
            color="neutral"
            variant="outline"
            icon="i-icon-park-outline:off-screen"
            @click="fullScreen"
          />
        </UTooltip>
        <UTooltip
          v-else
          text="完整展示"
        >
          <UButton
            color="neutral"
            variant="outline"
            icon="i-icon-park-outline:full-screen"
            title="完整展示"
            @click="fullScreen"
          />
        </UTooltip>
        <UTooltip text="新标签打开">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-fa-solid:external-link-alt"
            @click="openNew"
          />
        </UTooltip>
      </div>
      <iframe
        :srcdoc="doc"
        class="h-full w-full"
        title="展示面板"
        allowTransparency="true"
      />
    </div>
  </div>
</template>
