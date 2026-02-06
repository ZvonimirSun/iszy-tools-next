<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { beian, friendLinks } = usePublicConfig()

const links = ref<NavigationMenuItem[]>([])
if (friendLinks) {
  try {
    const tmp = JSON.parse(friendLinks)
    if (Array.isArray(tmp)) {
      links.value = tmp
    }
  }
  catch (e) {
    console.error('Failed to parse friendLinks:', e)
  }
}
</script>

<template>
  <UFooter>
    <template #left>
      <div class="text-muted text-sm flex flex-col gap-2">
        <span>Copyright © {{ new Date().getFullYear() }}</span>
        <template v-if="beian?.icp">
          <ULink to="https://beian.miit.gov.cn/#/Integrated/recordQuery" target="_blank">
            {{ beian.icp }}
          </ULink>
        </template>
        <div
          v-if="beian?.gonganNum"
          class="flex items-center gap-2 whitespace-nowrap"
        >
          <img class="w-4" src="/images/beian.png">
          <ULink :to="`https://beian.mps.gov.cn/#/query/webSearch?code=${beian.gonganId}`" target="_blank">
            {{ beian.gonganNum }}
          </ULink>
        </div>
      </div>
    </template>
    <template #right>
      <template v-if="links.length">
        <UNavigationMenu :items="links" variant="link" />
      </template>
    </template>
  </UFooter>
</template>

<style scoped>

</style>
