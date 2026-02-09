<script setup lang="ts">
const formInfo = reactive<{
  ppi: string
  pixelSize: string
  scaleDomination: string
  resolution: string
  unit: 'degree' | 'meter'
}>({
  ppi: '96',
  pixelSize: '0.26',
  scaleDomination: '295497598.570834',
  resolution: '0.703125013115789',
  unit: 'degree',
})
const lodInfo = reactive({
  ppi: 96,
  pixelSize: 0.26,
  count: 21,
  scaleDomination: 295497598.570834,
  resolution: 0.703125013115789,
  lod: 0,
})

const lastEdit: ('ppi' | 'scaleDomination' | 'resolution')[] = ['scaleDomination', 'resolution']

const lodsStr = ref('')
const resolutionStr = ref('')

function changePPI() {
  if (!formInfo.ppi) {
    return
  }
  const ppi = Number.parseFloat(formInfo.ppi)
  if (Number.isNaN(ppi)) {
    return
  }
  lodInfo.ppi = ppi
  formInfo.pixelSize = (ppiToPX(lodInfo.ppi) * 1000).toFixed(2)
  lodInfo.pixelSize = Number.parseFloat(formInfo.pixelSize)
  updateLastEdit('ppi')
  updateParams()
}

function changePixelSize() {
  if (!formInfo.pixelSize) {
    return
  }
  const pixelSize = Number.parseFloat(formInfo.pixelSize)
  if (Number.isNaN(pixelSize)) {
    return
  }
  lodInfo.pixelSize = pixelSize
  formInfo.ppi = pxToPPI(lodInfo.pixelSize / 1000).toFixed(3)
  lodInfo.ppi = Number.parseFloat(formInfo.ppi)
  updateLastEdit('ppi')
  updateParams()
}

function changeScaleDomination() {
  if (!formInfo.scaleDomination) {
    return
  }
  const scaleDomination = Number.parseFloat(formInfo.scaleDomination)
  if (Number.isNaN(scaleDomination)) {
    return
  }
  lodInfo.scaleDomination = scaleDomination
  updateLastEdit('scaleDomination')
  updateParams()
}

function changeResolution() {
  if (!formInfo.resolution) {
    return
  }
  const resolution = Number.parseFloat(formInfo.resolution)
  if (Number.isNaN(resolution)) {
    return
  }
  lodInfo.resolution = resolution
  updateLastEdit('resolution')
  updateParams()
}

function changeUnit() {
  lastEdit.splice(0, lastEdit.length)
  lastEdit.push(...['scaleDomination', 'ppi'] as ('ppi' | 'scaleDomination' | 'resolution')[])
  formInfo.scaleDomination = '295497598.570834'
  lodInfo.scaleDomination = Number.parseFloat(formInfo.scaleDomination)
  formInfo.ppi = '96'
  lodInfo.ppi = Number.parseFloat(formInfo.ppi)
  changePPI()
}

function changeCount() {
  if (!lodInfo.count) {
    return
  }
  if (lodInfo.count < 1) {
    lodInfo.count = 1
  }
  else if (lodInfo.count < lodInfo.lod + 1) {
    lodInfo.lod = lodInfo.count - 1
  }
}

function updateLastEdit(val: 'ppi' | 'scaleDomination' | 'resolution') {
  const index = lastEdit.indexOf(val)
  if (index !== -1) {
    lastEdit.splice(index, 1)
  }
  else {
    lastEdit.pop()
  }
  lastEdit.unshift(val)
}

function updateParams() {
  const scaleDominationEdited = lastEdit.includes('scaleDomination')
  const resolutionEdited = lastEdit.includes('resolution')
  const ppiEdited = lastEdit.includes('ppi')
  if (scaleDominationEdited && ppiEdited) {
    if (formInfo.scaleDomination && formInfo.ppi) {
      formInfo.resolution = getResolution(lodInfo.scaleDomination, lodInfo.ppi, formInfo.unit).toPrecision(11)
      lodInfo.resolution = Number.parseFloat(formInfo.resolution)
    }
  }
  else if (resolutionEdited && ppiEdited) {
    if (formInfo.resolution && formInfo.ppi) {
      formInfo.scaleDomination = getScaleDomination(lodInfo.resolution, lodInfo.ppi, formInfo.unit).toPrecision(11)
      lodInfo.scaleDomination = Number.parseFloat(formInfo.scaleDomination)
    }
  }
  else if (scaleDominationEdited && resolutionEdited && formInfo.scaleDomination) {
    formInfo.ppi = getPPI(lodInfo.scaleDomination, lodInfo.resolution, formInfo.unit).toFixed(3)
    lodInfo.ppi = Number.parseFloat(formInfo.ppi)
    formInfo.pixelSize = (ppiToPX(lodInfo.ppi) * 1000).toFixed(2)
    lodInfo.pixelSize = Number.parseFloat(formInfo.pixelSize)
  }
}

function generate() {
  let baseResolution
  if (lodInfo.lod === 0) {
    baseResolution = lodInfo.resolution
  }
  else {
    baseResolution = lodInfo.resolution * (2 ** lodInfo.lod)
  }
  const lods: {
    level: number
    resolution: number
    scale: number
  }[] = []
  for (let i = 0; i < lodInfo.count; i++) {
    const resolution = baseResolution / (2 ** i)
    lods.push({
      level: i,
      resolution: Number.parseFloat(resolution.toPrecision(11)),
      scale: Number.parseFloat(getScaleDomination(resolution, lodInfo.ppi, formInfo.unit).toPrecision(11)),
    })
  }
  lodsStr.value = JSON.stringify(lods, null, 2)
  resolutionStr.value = JSON.stringify(lods.map(item => item.resolution), null, 2)
}
</script>

<template>
  <div class="h-full w-full flex flex-col gap-4 items-start">
    <UForm class="w-full flex flex-col gap-4 items-start">
      <ContainerToolItem class="w-full" label="基础信息" content-class="grid grid-cols-24 gap-2">
        <UFormField
          label="坐标单位"
          class="col-span-12 sm:col-span-8 lg:col-span-4 grid grid-cols-[5rem_1fr]"
          orientation="horizontal"
        >
          <USelect
            v-model="formInfo.unit"
            class="w-full"
            :items="[
              { label: '度', value: 'degree' },
              { label: '米', value: 'meter' },
            ]"
            @change="changeUnit"
          />
        </UFormField>
        <UFormField
          label="当前层级"
          class="col-span-12 sm:col-span-8 lg:col-span-4 grid grid-cols-[5rem_1fr]"
          orientation="horizontal"
        >
          <UInputNumber
            v-model="lodInfo.lod"
            orientation="vertical"
            :min="0"
            :max="lodInfo.count"
            :step="1"
          />
        </UFormField>
        <UFormField
          label="切片层级数"
          class="col-span-12 sm:col-span-8 lg:col-span-4 grid grid-cols-[5rem_1fr]"
          orientation="horizontal"
        >
          <UInputNumber
            v-model="lodInfo.count"
            orientation="vertical"
            :min="0"
            :step="1"
            @change="changeCount"
          />
        </UFormField>
      </ContainerToolItem>
      <ContainerToolItem class="w-full" label="参数设置" content-class="grid grid-cols-24 gap-2">
        <UFormField
          label="地图分辨率"
          class="col-span-24 sm:col-span-12 lg:col-span-8 grid grid-cols-[7rem_1fr]"
          orientation="horizontal"
        >
          <UInput
            v-model="formInfo.resolution"
            orientation="vertical"
            class="w-full"
            @change="changeResolution"
          />
        </UFormField>
        <UFormField
          label="地图比例尺"
          class="col-span-24 sm:col-span-12 lg:col-span-8 grid grid-cols-[7rem_1fr]"
          orientation="horizontal"
        >
          <UInput
            v-model="formInfo.scaleDomination"
            orientation="vertical"
            class="w-full"
            @change="changeScaleDomination"
          />
        </UFormField>
        <UFormField
          label="屏幕分辨率(ppi)"
          class="col-span-24 sm:col-span-12 lg:col-span-4 grid grid-cols-[7rem_1fr]"
          orientation="horizontal"
        >
          <UInput
            v-model="formInfo.ppi"
            orientation="vertical"
            class="w-full"
            @change="changePPI"
          />
        </UFormField>
        <UFormField
          label="像元大小(mm)"
          class="col-span-24 sm:col-span-12 lg:col-span-4 grid grid-cols-[7rem_1fr]"
          orientation="horizontal"
        >
          <UInput
            v-model="formInfo.pixelSize"
            orientation="vertical"
            class="w-full"
            @change="changePixelSize"
          />
        </UFormField>
      </ContainerToolItem>
    </UForm>
    <UButton label="生成" @click="generate" />
    <ContainerToolItem v-if="lodsStr" class="w-full flex-1" content-class="overflow-auto grid grid-cols-2 gap-4 min-h-64">
      <ContainerInputLike class="overflow-auto col-span-2 md:col-span-1">
        <pre class="overflow-auto w-full h-full">{{ lodsStr }}</pre>
      </ContainerInputLike>
      <ContainerInputLike class="overflow-auto col-span-2 md:col-span-1">
        <pre class="overflow-auto w-full h-full">{{ resolutionStr }}</pre>
      </ContainerInputLike>
    </ContainerToolItem>
  </div>
</template>

<style lang="scss" scoped>
.form-item.el-form-item {
  width: 100%;
  margin: 0 0 .8rem;
}

.el-button.edit-btn {
  color: var(--el-color-primary);

  &:hover {
    color: var(--el-color-primary);
  }
}
</style>
