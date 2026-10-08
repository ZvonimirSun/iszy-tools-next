<script setup lang="ts">
const modules = useSettingsStore().modules
const { features: { authEnabled } } = usePublicConfig()
const userStore = useUserStore()
</script>

<template>
  <div class="flex items-center gap-2">
    <template v-if="authEnabled && userStore.logged">
      <USwitch v-model="modules.jsonEditor.syncCloud" />
      <span class="text-sm text-muted">同步云端记录</span>
    </template>
  </div>
</template>
