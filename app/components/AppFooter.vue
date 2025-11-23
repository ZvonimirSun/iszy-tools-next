<script setup lang="ts">
const { footer } = useAppConfig()
const { public: { beian } } = useRuntimeConfig()
</script>

<template>
  <UFooter>
    <template #left>
      <p class="text-muted text-sm">
        Copyright © {{ new Date().getFullYear() }}<template v-if="beian">
          &nbsp;|&nbsp;
          <ULink to="https://beian.miit.gov.cn/#/Integrated/recordQuery" target="_blank">
            {{ beian.icp }}
          </ULink>
        </template>
      </p>
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
