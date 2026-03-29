import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { MockPrj } from './mock'
import { setProject } from './mockData.service'

const emptyMockPrj: MockPrj = {
  id: '',
  name: '',
  path: '',
  description: '',
}

export const projects = ref<MockPrj[]>([])

export async function init() {
  try {
    await refreshMockProject()
    const prjId = useUrlSearchParams<{ prjId?: string }>('hash-params').prjId
    if (prjId) {
      selectProject(prjId)
    }
  }
  catch (e) {
    throw new Error((e as Error).message || '获取项目列表失败')
  }
}

export function getNewMockProject() {
  return { ...emptyMockPrj }
}

export function selectProject(prj: MockPrj | string) {
  if (typeof prj === 'string') {
    const tmp = projects.value.find(item => item.id === prj)
    if (!tmp) {
      useToast().add({ title: '未找到项目', color: 'error' })
      return
    }
    else {
      prj = tmp
    }
  }
  setProject(prj).then()
}

export async function createProject(prj: MockPrj) {
  try {
    await $fetch(`/api/mock/api/prj`, {
      method: 'POST',
      body: {
        ...prj,
        id: undefined,
      },
    })
    useToast().add({ title: '创建项目成功', color: 'success' })
    refreshMockProject().then()
    return true
  }
  catch (e) {
    useToast().add({ title: '创建项目失败', description: (e as Error).message, color: 'error' })
  }
  return false
}

export async function updateProject(prj: MockPrj) {
  try {
    await $fetch(`/api/mock/api/prj/${prj.id}`, {
      method: 'PUT',
      body: prj,
    })
    useToast().add({ title: '更新项目成功', color: 'success' })
    refreshMockProject().then()
    return true
  }
  catch (e) {
    useToast().add({ title: '更新项目失败', description: (e as Error).message, color: 'error' })
  }
  return false
}

export async function deleteProject(prj: MockPrj) {
  try {
    await $fetch(`/api/mock/api/prj/${prj.id}`, {
      method: 'DELETE',
    })
    useToast().add({ title: '删除项目成功', color: 'success' })
    refreshMockProject().then()
    return true
  }
  catch (e) {
    useToast().add({ title: '删除项目失败', description: (e as Error).message, color: 'error' })
  }
  return false
}

async function refreshMockProject() {
  try {
    const data = await $fetch<ResultDto<MockPrj[]>>('/api/mock/api/prj/list')
    projects.value = data.data || []
  }
  catch (e) {
    useToast().add({ title: '获取项目列表失败', description: (e as Error).message, color: 'error' })
  }
}
