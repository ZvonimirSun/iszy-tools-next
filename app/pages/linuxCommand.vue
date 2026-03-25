<script lang="ts" setup>
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

const toast = useToast()
const keyword = ref('')
const command = ref('')
const commandData = ref('')
const loadingCommand = ref('')
const { cdnOrigin } = usePublicConfig()

const store = useLinuxCommandStore()

const searchResults = computed(() => {
  if (keyword.value) {
    return Object.keys(store.data).filter(key => (store.data[key].n.toString().toLowerCase().includes(keyword.value.toLowerCase())))
  }
  else {
    return []
  }
})

onMounted(async () => {
  if (store.time) {
    const currentDate = dayjs()
    const storageDate = dayjs(store.time)
    if (dayjs.duration(currentDate.diff(storageDate)).asDays() <= 1) {
      return
    }
  }
  try {
    await store.getData()
  }
  catch (error) {
    toast.add({
      title: '获取Linux命令数据失败',
      color: 'error',
    })
  }
})

async function query(c: string) {
  if (loadingCommand.value === c) {
    return
  }

  command.value = c
  commandData.value = ''
  loadingCommand.value = c

  try {
    commandData.value = await $fetch<string>(`${cdnOrigin}/jsd/gh/jaywcjlove/linux-command@1.8.1/command/${c}.md`)
  }
  catch (e) {
    toast.add({
      title: '查询失败',
      color: 'error',
    })
  }
  finally {
    if (loadingCommand.value === c) {
      loadingCommand.value = ''
    }
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex items-center text-md text-muted">
      <span>数据来源：</span>
      <UButton
        href="https://github.com/jaywcjlove/linux-command"
        target="_blank"
        color="neutral"
        size="xs"
        variant="link"
      >
        jaywcjlove/linux-command
      </UButton>
    </div>

    <h3 class="text-xl text-pretty font-semibold text-highlighted">
      请输入要查询的命令
    </h3>

    <UInput
      v-model.trim="keyword"
      placeholder="man"
      class="w-full"
    />

    <USeparator v-show="keyword" />

    <template v-if="keyword">
      <h3 class="text-lg text-pretty font-semibold text-highlighted">
        搜索结果（点击查看详情）
      </h3>

      <div
        v-if="searchResults.length === 0"
        class="text-sm text-muted"
      >
        没有结果
      </div>

      <ul
        v-else
        class="w-full m-0 p-0 list-none flex flex-col gap-2"
      >
        <li
          v-for="item in searchResults"
          :key="item"
          class="w-full rounded-md border border-default p-3 flex items-start justify-between gap-3"
        >
          <div class="min-w-0 flex-1">
            <p class="m-0 text-base font-semibold text-highlighted break-all">
              {{ store.data[item].n }}
            </p>
            <p class="m-0 mt-1 text-sm text-toned break-all">
              {{ store.data[item].d }}
            </p>
          </div>

          <UModal :title="`${item} 命令详情`">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              :loading="loadingCommand === item"
              @click="query(item)"
            >
              查看详情
            </UButton>

            <template #body>
              <UEditor v-if="command === item && commandData" v-model="commandData" :editable="false" content-type="markdown" />
            </template>
          </UModal>
        </li>
      </ul>
    </template>
  </div>
</template>
