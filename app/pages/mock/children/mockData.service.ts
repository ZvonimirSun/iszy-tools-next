import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { MockData, MockPrj } from './mock'
import dayjs from 'dayjs'

const emptyMockData: MockData = {
  id: -1,
  name: '',
  type: 'all',
  enabled: true,
  path: '',
  description: '',
  delay: 0,
  contentType: '',
  response: '',
  projectId: '',
}

export const selectedProject = ref<MockPrj>()
export const mockData = ref<MockData[]>([])

export function getNewMockData() {
  if (!selectedProject.value) {
    throw new Error('未选择项目')
  }
  return {
    ...emptyMockData,
    projectId: selectedProject.value.id,
  }
}

export async function setProject(prj?: MockPrj) {
  selectedProject.value = prj
  mockData.value = []
  const params = useUrlSearchParams<{ prjId?: string }>('hash-params')
  if (selectedProject.value) {
    params.prjId = selectedProject.value.id
    await refreshMockData()
  }
  else {
    delete params.prjId
  }
}

export async function editData(data: MockData) {
  try {
    const res = await $fetch<ResultDto<never>>(`/api/mock/api/data/${data.id}`, {
      method: 'PUT',
      body: {
        ...data,
        id: undefined,
        projectId: undefined,
      },
    })
    if (res.success) {
      useToast().add({ title: '修改数据成功', color: 'success' })
      refreshMockData().then()
      return true
    }
    else {
      useToast().add({ title: '修改数据失败', color: 'error' })
    }
  }
  catch (e) {
    useToast().add({ title: '修改数据失败', color: 'error' })
  }
  return false
}

export async function createData(data: MockData) {
  try {
    const res = await $fetch<ResultDto<never>>(`/api/mock/api/data`, {
      method: 'POST',
      body: {
        ...data,
        id: undefined,
        projectId: selectedProject.value?.id,
      },
    })
    if (res.success) {
      useToast().add({ title: '创建数据成功', color: 'success' })
      refreshMockData().then()
      return true
    }
    else {
      useToast().add({ title: '创建数据失败', color: 'error' })
    }
  }
  catch (e) {
    useToast().add({ title: '创建数据失败', color: 'error' })
  }
  return false
}

export async function deleteData(data: MockData) {
  try {
    const res = await $fetch<ResultDto<never>>(`/api/mock/api/data/${data.id}`, {
      method: 'DELETE',
    })
    if (res.success) {
      useToast().add({ title: '删除数据成功', color: 'success' })
      refreshMockData().then()
      return true
    }
    else {
      useToast().add({ title: '删除数据失败', color: 'error' })
    }
  }
  catch (e) {
    useToast().add({ title: '删除数据失败', color: 'error' })
  }
  return false
}

async function refreshMockData() {
  if (!selectedProject.value) {
    useToast().add({ title: '未选择项目', color: 'error' })
    return
  }
  try {
    mockData.value = await getMockData(selectedProject.value)
  }
  catch (e) {
    useToast().add({ title: '获取数据列表失败', color: 'error' })
  }
}

// 获取接口列表
async function getMockData(prj: MockPrj) {
  const data = await $fetch<ResultDto<MockData[]>>(`/api/mock/api/prj/${prj.id}/list`)
  if (data.success) {
    return (data.data || []).map((item) => {
      item.createdAt = dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')
      item.url = `${usePublicConfig().apiOrigin}/mock/${prj.id}${prj.path}${item.path}`
      return item
    })
  }
  else {
    throw new Error(data.message)
  }
}
