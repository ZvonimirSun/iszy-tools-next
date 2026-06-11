<script setup lang="ts">
import { parseChineseIdCard } from './children/idChinese.service'

const idInput = ref('')
const { copy } = useCopy()

const parseResult = computed(() => parseChineseIdCard(idInput.value))

const regionMatchedText = computed(() => {
  const region = parseResult.value.region
  if (!region) {
    return '-'
  }
  return `${region.isProvinceMatched ? '省' : '省(未匹配)'} / ${region.isCityMatched ? '市' : '市(未匹配)'} / ${region.isDistrictMatched ? '区县' : '区县(未匹配)'}`
})

function clear() {
  idInput.value = ''
}

function copyAsJson() {
  copy(JSON.stringify(parseResult.value, null, 2))
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <ContainerToolItem label="身份证号码">
      <div class="flex flex-col gap-3">
        <UInput
          v-model="idInput"
          placeholder="请输入 15 位或 18 位身份证号码..."
          class="w-full"
          autofocus
        />
        <div class="text-xs text-muted">
          自动解析并校验：支持 15 位转 18 位，支持地址码(省/市/区县)完整映射。
        </div>
      </div>
    </ContainerToolItem>

    <div class="flex flex-wrap gap-2">
      <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" @click="clear">
        清空
      </UButton>
      <UButton color="neutral" variant="outline" icon="i-lucide:copy" @click="copyAsJson">
        复制 JSON 结果
      </UButton>
    </div>

    <UAlert
      v-if="parseResult.errors.length"
      color="error"
      variant="soft"
      :title="parseResult.errors[0]"
      icon="i-lucide:circle-alert"
    />

    <UAlert
      v-if="parseResult.warnings.length"
      color="warning"
      variant="soft"
      :title="parseResult.warnings[0]"
      icon="i-lucide:triangle-alert"
    />

    <ContainerToolItem label="校验信息">
      <div class="grid gap-2 md:grid-cols-3">
        <UFormField label="合法性">
          <UInput :model-value="parseResult.normalizedInput ? (parseResult.valid ? '合法' : '不合法') : '-'" readonly />
        </UFormField>
        <UFormField label="输入类型">
          <UInput :model-value="parseResult.sourceType || '-'" readonly />
        </UFormField>
        <UFormField label="18 位标准号">
          <UInput :model-value="parseResult.id18 || '-'" readonly />
        </UFormField>
        <UFormField label="脱敏号">
          <UInput :model-value="parseResult.maskedId || '-'" readonly />
        </UFormField>
        <UFormField label="校验位">
          <UInput :model-value="parseResult.checksumCode || '-'" readonly />
        </UFormField>
        <UFormField label="理论校验位">
          <UInput :model-value="parseResult.expectedChecksumCode || '-'" readonly />
        </UFormField>
      </div>
    </ContainerToolItem>

    <ContainerToolItem label="地区信息">
      <div class="grid gap-2 md:grid-cols-3">
        <UFormField label="地址码">
          <UInput :model-value="parseResult.addressCode || '-'" readonly />
        </UFormField>
        <UFormField label="匹配状态">
          <UInput :model-value="regionMatchedText" readonly />
        </UFormField>
        <UFormField label="完整地区">
          <UInput :model-value="parseResult.region?.fullName || '-'" readonly />
        </UFormField>
        <UFormField label="省">
          <UInput :model-value="parseResult.region?.provinceName || '-'" readonly />
        </UFormField>
        <UFormField label="市">
          <UInput :model-value="parseResult.region?.cityName || '-'" readonly />
        </UFormField>
        <UFormField label="区/县">
          <UInput :model-value="parseResult.region?.districtName || '-'" readonly />
        </UFormField>
      </div>
    </ContainerToolItem>

    <ContainerToolItem label="个人信息(可推导)">
      <div class="grid gap-2 md:grid-cols-3">
        <UFormField label="性别">
          <UInput :model-value="parseResult.gender || '-'" readonly />
        </UFormField>
        <UFormField label="顺序码">
          <UInput :model-value="parseResult.sequenceCode || '-'" readonly />
        </UFormField>
        <UFormField label="出生日期">
          <UInput :model-value="parseResult.birth?.formatted || '-'" readonly />
        </UFormField>
        <UFormField label="星期">
          <UInput :model-value="parseResult.birth?.weekDay || '-'" readonly />
        </UFormField>
        <UFormField label="年龄">
          <UInput :model-value="parseResult.birth ? `${parseResult.birth.age} 岁` : '-'" readonly />
        </UFormField>
        <UFormField label="是否成年">
          <UInput :model-value="parseResult.birth ? (parseResult.birth.isAdult ? '是' : '否') : '-'" readonly />
        </UFormField>
        <UFormField label="生肖">
          <UInput :model-value="parseResult.birth?.zodiac || '-'" readonly />
        </UFormField>
        <UFormField label="星座">
          <UInput :model-value="parseResult.birth?.constellation || '-'" readonly />
        </UFormField>
      </div>
    </ContainerToolItem>
  </div>
</template>

<style scoped lang="scss">

</style>
