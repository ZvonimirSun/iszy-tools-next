<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { MockData } from './mock'
import { createData, deleteData, editData, getNewMockData, mockData, selectedProject, setProject } from './mockData.service'

const toast = useToast()
const { copy } = useCopy({ text: '复制成功' })

const { apiOrigin } = usePublicConfig()
const showDataDialog = ref(false)
const dataForm: MockData & { response: any } = reactive(getNewMockData())

const columns: TableColumn<MockData>[] = [
  {
    accessorKey: 'name',
    header: '名称',
    size: 300,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    size: 100,
  },
  {
    accessorKey: 'enabled',
    header: '请求状态',
    size: 100,
  },
  {
    accessorKey: 'path',
    header: '接口地址',
    size: 300,
  },
  {
    accessorKey: 'description',
    header: '接口描述',
    size: 300,
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    size: 200,
  },
  {
    id: 'operations',
    header: '操作',
    enableHiding: false,
    size: 200,
  },
]

const methodOptions = [
  { label: 'ALL', value: 'all' },
  { label: 'GET', value: 'get' },
  { label: 'POST', value: 'post' },
  { label: 'DELETE', value: 'delete' },
  { label: 'PUT', value: 'put' },
]

const contentTypeOptions = [
  { label: '自动', value: 'auto' },
  { label: 'XML', value: 'text/xml' },
  { label: 'HTML', value: 'text/html' },
]

async function handleDeleteData(data: MockData, close?: () => void) {
  const status = await deleteData(data)
  if (status) {
    close?.()
  }
}

function openCreateDataDialog() {
  Object.assign(dataForm, getNewMockData())
  showDataDialog.value = true
}

function openEditDataDialog(data: MockData) {
  let response: string | unknown
  try {
    response = JSON.parse(data.response) as unknown
  }
  catch (e) {
    response = data.response
  }
  Object.assign(dataForm, {
    id: data.id,
    name: data.name,
    type: data.type,
    enabled: data.enabled,
    path: data.path,
    description: data.description,
    delay: data.delay,
    contentType: data.contentType,
    response,
    projectId: data.projectId,
  })
  showDataDialog.value = true
}

async function createOrEditData(data: MockData & { response: any }) {
  let response = data.response
  if (!response) {
    toast.add({ title: '请填写接口返回数据', color: 'error' })
    return
  }
  if (typeof response !== 'string') {
    try {
      response = JSON.stringify(response)
    }
    catch (e) {
      response = response.toString()
    }
  }
  else {
    try {
      response = JSON.stringify(JSON.parse(response))
    }
    catch (e) {}
  }
  let status: boolean
  if (data.id > -1) {
    status = await editData({ ...data, response })
  }
  else {
    status = await createData({ ...data, response })
  }
  if (status) {
    showDataDialog.value = false
  }
}
</script>

<template>
  <div v-if="selectedProject" class="flex h-full w-full flex-col gap-4">
    <div class="flex items-center gap-2">
      <UButton
        icon="i-lucide:arrow-left"
        color="neutral"
        variant="ghost"
        @click="setProject()"
      />
      <h2 class="text-xl font-semibold text-highlighted">
        {{ selectedProject.name }}
      </h2>
    </div>

    <ContainerToolItem content-class="flex flex-col gap-2">
      <div class="flex gap-2">
        <div class="w-24 font-semibold text-highlighted">
          接口根地址
        </div>
        <CopyableText
          :val="`${apiOrigin}/mock/${selectedProject.id}${selectedProject.path}`"
          class="flex-1 break-all"
        />
      </div>
      <div class="flex gap-2 sm:items-center">
        <div class="w-24 font-semibold text-highlighted">
          项目ID
        </div>
        <CopyableText :val="selectedProject.id" class="flex-1 break-all" />
      </div>
    </ContainerToolItem>

    <div class="flex justify-end">
      <UButton color="primary" @click="openCreateDataDialog">
        新增接口
      </UButton>
    </div>

    <UTable
      :data="mockData"
      :columns="columns"
      :column-pinning="{ right: ['operations'] }"
      sticky
      class="flex-1 h-full w-full bg-elevated/50 rounded-lg shadow border border-muted"
    >
      <template #type-cell="{ row }">
        <UBadge color="primary" variant="subtle" :label="row.original.type" />
      </template>
      <template #enabled-cell="{ row }">
        <UBadge color="success" variant="subtle">
          {{ row.original.enabled ? '开启' : '关闭' }}
        </UBadge>
      </template>
      <template #path-cell="{ row }">
        <CopyableText :val="row.original.path" />
      </template>
      <template #operations-cell="{ row }">
        <div class="flex items-center gap-2">
          <UButton
            label="复制"
            size="sm"
            color="neutral"
            variant="outline"
            @click="copy(row.original.url)"
          />
          <UButton
            label="编辑"
            size="sm"
            color="neutral"
            variant="outline"
            @click="openEditDataDialog(row.original)"
          />
          <UPopover>
            <UButton
              label="删除"
              size="sm"
              color="error"
            />
            <template #content="{ close }">
              <div class="flex items-center gap-2 p-2">
                <span class="text-sm">确认删除</span>
                <UButton
                  size="xs"
                  color="error"
                  @click="handleDeleteData(row.original, close)"
                >
                  确认
                </UButton>
              </div>
            </template>
          </UPopover>
        </div>
      </template>
    </UTable>
    <UModal
      v-model:open="showDataDialog"
      fullscreen
      :title="dataForm.id > -1 ? '修改接口' : '添加接口'"
    >
      <template #body>
        <div class="flex flex-wrap h-full w-full gap-4 overflow-auto">
          <UForm :state="dataForm" class="w-full sm:w-64 h-auto sm:h-full flex flex-col gap-3 overflow-auto">
            <UFormField label="接口名" required>
              <UInput v-model="dataForm.name" class="w-full" />
            </UFormField>
            <UFormField label="类型(method)" required>
              <USelect v-model="dataForm.type" :items="methodOptions" class="w-full" />
            </UFormField>
            <UFormField label="返回延时(单位毫秒)">
              <UInputNumber v-model="dataForm.delay" class="w-full" :min="0" :step="1" />
            </UFormField>
            <UFormField label="数据类型">
              <USelect v-model="dataForm.contentType" :items="contentTypeOptions" class="w-full" placeholder="自动" />
            </UFormField>
            <UFormField label="接口" required>
              <UInput v-model="dataForm.path" class="w-full" />
            </UFormField>
            <UFormField label="接口描述">
              <UTextarea v-model="dataForm.description" class="w-full" :rows="4" />
            </UFormField>
            <UFormField label="接口状态">
              <USwitch v-model="dataForm.enabled" />
            </UFormField>
          </UForm>
          <div class="sm:flex-1 h-100 sm:h-full overflow-auto">
            <JsonEditor
              v-model="dataForm.response"
              class="h-full"
              mode="text"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showDataDialog = false">
            取消
          </UButton>
          <UButton
            color="primary"
            @click="createOrEditData(dataForm)"
          >
            提交
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped lang="scss">
table th,
table td {
  white-space: nowrap;
}

table td:nth-child(5) {
  max-width: 20rem;
}
</style>
