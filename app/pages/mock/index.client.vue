<script setup lang="ts">
import { selectedProject, setProject } from './children/mockData.service'
import MockDetail from './children/mockDetail.vue'
import MockList from './children/mockList.vue'
import { init, selectProject } from './children/mockProject.service'

definePageMeta({
  layout: 'wide',
})

const params = useUrlSearchParams<{ prjId?: string }>('hash-params')

onMounted(() => {
  init()
})

watch(params, () => {
  const prjId = params.prjId
  if (prjId && !selectedProject.value) {
    selectProject(prjId)
  }
  else if (!prjId && selectedProject.value) {
    setProject()
  }
})
</script>

<template>
  <div class="h-full w-full overflow-y-auto">
    <MockList
      v-if="!selectedProject"
    />
    <MockDetail v-else />
  </div>
</template>

<style scoped lang="scss">

</style>
