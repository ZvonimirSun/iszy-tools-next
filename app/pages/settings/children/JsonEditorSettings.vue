<script setup lang="ts">
const modules = useSettingsStore().modules
</script>

<template>
  <div class="flex items-center gap-2">
    <USwitch v-model="modules.jsonEditor.syncCloud" />
    <span class="text-sm text-muted">同步云端记录</span>
  </div>
</template>

