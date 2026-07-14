<script setup lang="ts">
import type { ChmodState, PermissionSet } from './children/chmodCalculator.service'
import { chmodStateToOctal, chmodStateToSymbolic, createEmptyChmodState, parseChmodOctal } from './children/chmodCalculator.service'

const state = reactive<ChmodState>(createEmptyChmodState())
const octalInput = ref(chmodStateToOctal(state))
const errorMessage = ref('')
const { copy } = useCopy()

const groups: Array<{ key: keyof ChmodState, label: string }> = [
  { key: 'owner', label: 'Owner' },
  { key: 'group', label: 'Group' },
  { key: 'others', label: 'Others' },
]
const permissions: Array<{ key: keyof PermissionSet, label: string, value: number }> = [
  { key: 'read', label: 'Read', value: 4 },
  { key: 'write', label: 'Write', value: 2 },
  { key: 'execute', label: 'Execute', value: 1 },
]

const octal = computed(() => chmodStateToOctal(state))
const symbolic = computed(() => chmodStateToSymbolic(state))
const command = computed(() => `chmod ${octal.value} file`)

watch(octal, (value) => {
  octalInput.value = value
})

function applyOctal() {
  try {
    const parsed = parseChmodOctal(octalInput.value)
    Object.assign(state.owner, parsed.owner)
    Object.assign(state.group, parsed.group)
    Object.assign(state.others, parsed.others)
    errorMessage.value = ''
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
    <div class="grid gap-3 rounded-lg border border-muted bg-muted/30 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <UFormField label="八进制权限">
        <UInput v-model="octalInput" class="w-full font-mono" maxlength="3" placeholder="755" @keyup.enter="applyOctal" />
      </UFormField>
      <UButton color="primary" icon="i-lucide:check" @click="applyOctal">
        应用
      </UButton>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="errorMessage"
    />

    <div class="overflow-hidden rounded-lg border border-muted bg-muted/30">
      <div class="grid grid-cols-[7rem_repeat(3,minmax(0,1fr))] gap-3 border-b border-muted px-4 py-3 text-sm font-medium text-muted">
        <span />
        <span v-for="permission in permissions" :key="permission.key">
          {{ permission.label }} ({{ permission.value }})
        </span>
      </div>
      <div
        v-for="group in groups"
        :key="group.key"
        class="grid grid-cols-[7rem_repeat(3,minmax(0,1fr))] items-center gap-3 border-b border-muted px-4 py-3 last:border-b-0"
      >
        <span class="font-medium">{{ group.label }}</span>
        <UCheckbox
          v-for="permission in permissions"
          :key="permission.key"
          v-model="state[group.key][permission.key]"
          :label="permission.label"
        />
      </div>
    </div>

    <div class="rounded-lg border border-muted bg-muted/30 p-4">
      <div class="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_2rem] sm:items-center">
        <span class="text-sm font-medium text-muted sm:text-right">Octal</span>
        <UInput :model-value="octal" class="font-mono" readonly />
        <UButton color="neutral" variant="ghost" icon="i-lucide:copy" size="sm" class="w-8" @click="copy(octal)" />

        <span class="text-sm font-medium text-muted sm:text-right">Symbolic</span>
        <UInput :model-value="symbolic" class="font-mono" readonly />
        <UButton color="neutral" variant="ghost" icon="i-lucide:copy" size="sm" class="w-8" @click="copy(symbolic)" />

        <span class="text-sm font-medium text-muted sm:text-right">Command</span>
        <UInput :model-value="command" class="font-mono" readonly />
        <UButton color="neutral" variant="ghost" icon="i-lucide:copy" size="sm" class="w-8" @click="copy(command)" />
      </div>
    </div>
  </div>
</template>
