<script setup lang="ts">
const { footer: { beian, since, copyright } } = usePublicConfig()

const year = new Date().getFullYear().toString()
let displayYear: string = year.toString()
if (since && since.toString() !== year) {
  displayYear = `${since} - ${year}`
}
</script>

<template>
  <UFooter>
    <template #left>
      <div class="text-muted text-sm flex flex-col gap-2">
        <div class="flex gap-1">
          <span>Copyright © {{ displayYear }}</span>
          <span v-if="copyright">{{ copyright }}</span>
        </div>
        <template v-if="beian?.enable">
          <template v-if="beian.icp">
            <ULink to="https://beian.miit.gov.cn/#/Integrated/recordQuery" target="_blank">
              {{ beian.icp }}
            </ULink>
          </template>
          <div
            v-if="beian.gonganNum"
            class="flex items-center gap-2 whitespace-nowrap"
          >
            <img class="w-4" src="~/assets/images/beian.png" alt="公安备案">
            <ULink :to="`https://beian.mps.gov.cn/#/query/webSearch?code=${beian.gonganId}`" target="_blank">
              {{ beian.gonganNum }}
            </ULink>
          </div>
        </template>
      </div>
    </template>
  </UFooter>
</template>
