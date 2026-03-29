<script setup lang="ts">
import type { MockPrj } from './mock'
import {
  createProject,
  deleteProject,
  getNewMockProject,
  projects,
  selectProject,
  updateProject,
} from './mockProject.service'

const showPrjDialog = ref(false)
const form: MockPrj = reactive({
  id: '',
  name: '',
  path: '',
  description: '',
})

async function handleDeleteProject(prj: MockPrj, close?: () => void) {
  const status = await deleteProject(prj)
  if (status) {
    close?.()
  }
}

function openCreatePrjDialog() {
  Object.assign(form, getNewMockProject())
  showPrjDialog.value = true
}

function openEditPrjDialog(prj: MockPrj) {
  Object.assign(form, {
    id: prj.id ?? '',
    name: prj.name,
    path: prj.path,
    description: prj.description ?? '',
  })
  showPrjDialog.value = true
}

async function createOrEditPrj(prj: MockPrj) {
  let status: boolean
  if (prj.id) {
    status = await updateProject(prj)
  }
  else {
    status = await createProject(prj)
  }
  if (status) {
    showPrjDialog.value = false
  }
}
</script>

<template>
  <div class="h-full w-full overflow-auto">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
      <div
        v-for="(prj, index) of projects"
        :key="index"
        class="flex aspect-3/2 flex-col overflow-hidden rounded-lg border border-default bg-elevated shadow-xs transition hover:shadow-sm"
      >
        <div class="bg-muted px-4 py-2 text-lg font-bold text-highlighted line-clamp-2">
          {{ prj.name }}
        </div>
        <div class="flex-1 overflow-auto px-4 py-2 text-sm leading-relaxed">
          <table class="w-full">
            <tbody>
              <tr>
                <td class="pr-2 text-right font-semibold align-top w-12">
                  ID:
                </td>
                <td class="break-all align-top">
                  {{ prj.id }}
                </td>
              </tr>
              <tr>
                <td class="pr-2 text-right font-semibold align-top">
                  路径:
                </td>
                <td class="break-all align-top">
                  {{ prj.path }}
                </td>
              </tr>
              <tr>
                <td class="pr-2 text-right font-semibold align-top">
                  描述:
                </td>
                <td class="text-toned align-top">
                  {{ prj.description || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-center border-t border-default">
          <UButton
            icon="i-icon-park-outline:preview-open"
            color="primary"
            variant="ghost"
            class="flex-1 rounded-none flex justify-center cursor-pointer"
            @click="selectProject(prj)"
          />
          <UButton
            icon="i-icon-park-outline:edit-two"
            color="primary"
            variant="ghost"
            class="flex-1 rounded-none flex justify-center cursor-pointer"
            @click="openEditPrjDialog(prj)"
          />
          <UPopover>
            <UButton
              icon="i-icon-park-outline:delete"
              color="error"
              variant="ghost"
              class="flex-1 rounded-none flex justify-center cursor-pointer"
            />
            <template #content="{ close }">
              <div class="flex items-center gap-2 p-2">
                <span class="text-sm">确认删除</span>
                <UButton
                  size="xs"
                  color="error"
                  @click="handleDeleteProject(prj, close)"
                >
                  确认
                </UButton>
              </div>
            </template>
          </UPopover>
        </div>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        variant="outline"
        class="aspect-3/2 w-full items-center justify-center"
        @click="openCreatePrjDialog"
      >
        新增项目
      </UButton>
    </div>
    <UModal
      v-model:open="showPrjDialog"
      :title="form.id ? '修改项目' : '添加项目'"
      :ui="{
        content: 'modal-container',
      }"
    >
      <template #body>
        <UForm :state="form" class="flex flex-col gap-3">
          <UFormField label="项目名称" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField label="接口基础路径" required>
            <UInput v-model="form.path" class="w-full" />
          </UFormField>
          <UFormField label="项目描述">
            <UTextarea v-model="form.description" class="w-full" :rows="4" />
          </UFormField>
        </UForm>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showPrjDialog = false">
            取消
          </UButton>
          <UButton
            color="primary"
            @click="createOrEditPrj(form)"
          >
            提交
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped lang="scss">
/* grid 布局已自适应，无需额外媒体查询 */
</style>
