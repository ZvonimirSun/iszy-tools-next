<script setup lang="ts">
const { footer } = useAppConfig()
const { public: { beian } } = useRuntimeConfig()
</script>

<template>
  <UFooter>
    <template #left>
      <div class="text-muted text-sm whitespace-nowrap flex items-center gap-2">
        Copyright © {{ new Date().getFullYear() }}
        <template v-if="beian">
          |
          <ULink to="https://beian.miit.gov.cn/#/Integrated/recordQuery" target="_blank">
            {{ beian.icp }}
          </ULink>
        </template>
        <template v-if="beian?.gonganNum">
          |
          <img class="w-4" src="/images/beian.png">
          <ULink :to="`https://beian.mps.gov.cn/#/query/webSearch?code=${beian.gonganId}`" target="_blank">
            {{ beian.gonganNum }}
          </ULink>
        </template>
      </div>
    </template>
    <template #right>
      <template v-if="footer?.links">
        <UNavigationMenu :items="footer.links" variant="link" />
      </template>
    </template>
  </UFooter>
</template>

<style scoped>

</style>
