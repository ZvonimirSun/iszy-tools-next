<script setup lang="ts">
import type { ImgHostingFileItem } from './children/imgHosting.d'
import { deleteFiles, listFiles } from './children/imgHosting.service'
import ImgHostingList from './children/imgHostingList.vue'
import ImgHostingSettings from './children/imgHostingSettings.vue'
import ImgHostingUpload from './children/imgHostingUpload.vue'

definePageMeta({ layout: 'full' })

const store = useImgHostingStore()
const toast = useToast()

type TabValue = 'upload' | 'list' | 'settings'
const activeTab = ref<TabValue>('upload')

const tabItems = [
  { label: '上传图片', value: 'upload' as const },
  { label: '图片列表', value: 'list' as const },
  { label: '图床设置', value: 'settings' as const },
]

const files = ref<ImgHostingFileItem[]>([])
const loading = ref(false)
const errorMessage = ref('')
const listLoaded = ref(false)

async function refreshList() {
  if (!store.activeConfig) {
    files.value = []
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    files.value = await listFiles(store.activeConfig)
  }
  catch (e) {
    console.error(e)
    errorMessage.value = '获取文件列表失败，请检查配置和网络连接'
    files.value = []
  }
  finally {
    loading.value = false
  }
}

async function handleDelete(keys: string[]) {
  if (!store.activeConfig)
    return

  try {
    await deleteFiles(store.activeConfig, keys)
    files.value = files.value.filter(f => !keys.includes(f.key))
    toast.add({ title: '删除成功' })
  }
  catch (e) {
    console.error(e)
    toast.add({ title: '删除失败', color: 'error' })
  }
}

function handleUploaded(item: { key: string, url: string }) {
  files.value.unshift({
    key: item.key,
    url: item.url,
    size: 0,
    lastModified: new Date(),
  })
}

watch(activeTab, (tab) => {
  if (tab === 'list' && !listLoaded.value) {
    listLoaded.value = true
    if (store.activeConfig) {
      refreshList()
    }
  }
})

watch(() => store.activeConfigId, () => {
  if (activeTab.value === 'list') {
    files.value = []
    errorMessage.value = ''
    if (store.activeConfigId) {
      refreshList()
    }
  }
})
</script>

<template>
  <div class="flex flex-col h-full">
    <UTabs
      v-model="activeTab"
      class="w-full px-4 sm:px-6 pt-4"
      :content="false"
      :items="tabItems"
    />

    <div class="flex-1 overflow-auto p-4 sm:p-6">
      <!-- Tab 1: 上传图片 -->
      <div v-if="activeTab === 'upload'">
        <ContainerToolItem label="上传图片">
          <ImgHostingUpload
            :config="store.activeConfig"
            @uploaded="handleUploaded"
          />
        </ContainerToolItem>
      </div>

      <!-- Tab 2: 图片列表 -->
      <div v-if="activeTab === 'list'">
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="soft"
          :title="errorMessage"
          icon="i-lucide:circle-alert"
          class="mb-4"
        />
        <ImgHostingList
          :files="files"
          :config="store.activeConfig"
          :loading="loading"
          @refresh="refreshList"
          @delete="handleDelete"
        />
      </div>

      <!-- Tab 3: 图床设置 -->
      <div v-if="activeTab === 'settings'">
        <ImgHostingSettings />
      </div>
    </div>
  </div>
</template>
