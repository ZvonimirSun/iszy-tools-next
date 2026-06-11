<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type { ScheduleRow } from './children/mtqLoans.types'
import { useMtqLoans } from './children/useMtqLoans'

const {
  data,
  repaymentPeriodItems,
  repaymentTypeItems,
  validationMessage,
  eventDisplayList,
  dataSource,
  summary,
  addPrepayment,
  addRateAdjustment,
  removeEventAt,
  reset,
} = useMtqLoans()

const columns: TableColumn<ScheduleRow>[] = [
  { accessorKey: 'times', header: '期次', size: 80 },
  { accessorKey: 'rowType', header: '类型', size: 90 },
  { accessorKey: 'repaymentDate', header: '还款日期', size: 130 },
  { accessorKey: 'monthlyAmount', header: '每月还款', size: 120 },
  { accessorKey: 'interestRepayment', header: '偿还利息', size: 120 },
  { accessorKey: 'principalRepayment', header: '偿还本金', size: 120 },
  { accessorKey: 'rateAfter', header: '利率', size: 150 },
  { accessorKey: 'remainingPrincipal', header: '剩余本金', size: 120 },
]

function getEventSequenceLabel(displayIndex: number) {
  return eventDisplayList.value.length - displayIndex
}

function getEventMinDate(displayIndex: number) {
  return eventDisplayList.value[displayIndex + 1]?.item.repaymentDate || data.interestStartDate
}

function getEventMaxDate(displayIndex: number) {
  return eventDisplayList.value[displayIndex - 1]?.item.repaymentDate
}

function formatMoney(value?: number) {
  if (typeof value !== 'number') {
    return '-'
  }
  return value.toFixed(2)
}
</script>

<template>
  <div class="h-full w-full overflow-auto flex flex-col gap-4">
    <UAlert color="warning" variant="subtle" title="计算仅供参考，请以银行数据为准" />

    <div class="flex flex-1 flex-wrap gap-4 items-start overflow-auto">
      <ContainerToolItem label="参数设置" content-class="flex flex-col gap-4" class="w-full md:w-90 max-h-full">
        <UForm class="flex flex-col gap-3">
          <UFormField label="贷款金额(元)">
            <UInputNumber v-model="data.loanAmount" class="w-full" orientation="vertical" :min="0" :step="1000" />
          </UFormField>

          <UFormField label="贷款期限">
            <USelect v-model="data.repaymentPeriod" class="w-full" :items="repaymentPeriodItems" />
          </UFormField>

          <UFormField label="贷款月数">
            <UInputNumber v-model="data.loanMonth" class="w-full" orientation="vertical" :min="1" :step="1" :disabled="data.repaymentPeriod !== 0" />
          </UFormField>

          <UFormField label="贷款利率(%)">
            <UInputNumber v-model="data.lendingRates" class="w-full" orientation="vertical" :min="0" :step="0.01" />
          </UFormField>

          <UFormField label="还款方式">
            <USelect v-model="data.repayment" class="w-full" :items="repaymentTypeItems" />
          </UFormField>

          <UFormField label="计息日期">
            <DatePicker v-model="data.interestStartDate" value-format="YYYY-MM-DD" class="w-full" />
          </UFormField>

          <UFormField label="首次还款日期">
            <DatePicker v-model="data.firstRepaymentDate" value-format="YYYY-MM-DD" class="w-full" />
          </UFormField>

          <div class="flex flex-wrap gap-1 pt-2">
            <UButton label="添加提前还款" :disabled="!data.firstRepaymentDate || !data.interestStartDate" @click="addPrepayment" />
            <UButton label="添加调整利率" color="warning" variant="outline" :disabled="!data.interestStartDate" @click="addRateAdjustment" />
            <UButton label="重置" color="error" variant="soft" icon="i-lucide:rotate-ccw" @click="reset" />
            <UButton
              v-if="eventDisplayList.length"
              label="移除最新事件"
              color="neutral"
              variant="outline"
              @click="removeEventAt(0)"
            />
          </div>

          <div v-if="eventDisplayList.length" class="flex flex-col gap-3">
            <div class="text-xs text-muted">
              卡片已合并为同一时间线：越后添加的卡片越靠上，日期需自下而上递增。
            </div>
            <div v-for="(event, displayIndex) in eventDisplayList" :key="`${event.kind}-${displayIndex}`" class="rounded-lg border border-muted p-3 bg-elevated/30">
              <div class="mb-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <UBadge color="primary" variant="subtle">
                    {{ event.kind === 'rateAdjustment' ? '调整利率' : '提前还款' }}
                  </UBadge>
                  <span class="text-sm font-medium">第{{ getEventSequenceLabel(displayIndex) }}条事件</span>
                </div>
                <UButton size="xs" color="error" variant="ghost" label="删除" @click="removeEventAt(displayIndex)" />
              </div>
              <div v-if="event.kind === 'prepayment'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UFormField label="还款日期">
                  <DatePicker
                    v-model="event.item.repaymentDate"
                    value-format="YYYY-MM-DD"
                    :min="getEventMinDate(displayIndex)"
                    :max="getEventMaxDate(displayIndex)"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="提前还款金额(元)">
                  <UInputNumber v-model="event.item.repaymentAmount" class="w-full" orientation="vertical" :min="0" :step="0.01" />
                </UFormField>
                <UFormField label="调整期数(月)">
                  <UInputNumber v-model="event.item.adjustLoanMonth" class="w-full" orientation="vertical" :min="0" :step="1" />
                </UFormField>
                <UFormField label="补充金额(元)(可选)">
                  <UInputNumber v-model="event.item.extraCharge" class="w-full" orientation="vertical" :min="0" :step="0.01" />
                </UFormField>
              </div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <UFormField label="调息日期">
                  <DatePicker
                    v-model="event.item.repaymentDate"
                    value-format="YYYY-MM-DD"
                    :min="getEventMinDate(displayIndex)"
                    :max="getEventMaxDate(displayIndex)"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="新利率(%)">
                  <UInputNumber v-model="event.item.lendingRates" class="w-full" orientation="vertical" :min="0" :step="0.01" />
                </UFormField>
              </div>
            </div>
          </div>
        </UForm>
      </ContainerToolItem>

      <div class="md:flex-1 md:h-full flex flex-col gap-4 overflow-auto">
        <ContainerToolItem label="汇总" class="max-h-1/3" content-class="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div class="rounded-lg border border-muted p-3 bg-elevated/20">
            <div class="mb-2 font-medium text-highlighted">
              本金相关
            </div>
            <div class="space-y-1 text-sm">
              <div>
                贷款金额: {{ formatMoney(summary?.principal.loanAmount) }} 元
              </div>
              <div>累计提前还本金: {{ formatMoney(summary?.principal.cumulativePrepaymentPrincipal) }} 元</div>
              <div>累计调整期数: {{ formatMoney(summary?.principal.cumulativeAdjustLoanMonth) }} 月</div>
              <div>最终剩余本金: {{ formatMoney(summary?.principal.endingPrincipal) }} 元</div>
            </div>
          </div>
          <div class="rounded-lg border border-muted p-3 bg-elevated/20">
            <div class="mb-2 font-medium text-highlighted">
              利息相关
            </div>
            <div class="space-y-1 text-sm">
              <div>
                原累计利息: {{ formatMoney(summary?.interest.originalCumulativeInterestPayment) }} 元
              </div>
              <div>当前累计利息: {{ formatMoney(summary?.interest.cumulativeInterestPayment) }} 元</div>
              <div>累计节省利息: {{ formatMoney(summary?.interest.savedMoney) }} 元</div>
            </div>
          </div>
          <div class="rounded-lg border border-muted p-3 bg-elevated/20">
            <div class="mb-2 font-medium text-highlighted">
              额外费用相关
            </div>
            <div class="space-y-1 text-sm">
              <div>
                额外费用合计: {{ formatMoney(summary?.extra.totalExtraCharge) }} 元
              </div>
              <div>原总支出: {{ formatMoney(summary?.originalTotalOutflow) }} 元</div>
              <div>当前总支出: {{ formatMoney(summary?.currentTotalOutflow) }} 元</div>
              <div>净节省(含额外费用): {{ formatMoney(summary?.netOutflowSaved) }} 元</div>
            </div>
          </div>
        </ContainerToolItem>

        <UAlert v-if="validationMessage" color="error" variant="subtle" :title="validationMessage" />

        <ContainerToolItem label="还款明细" class="flex-1 overflow-auto" content-class="w-full p-0 overflow-auto">
          <UTable
            :data="dataSource"
            :columns="columns"
            sticky
            class="w-full h-full rounded-lg shadow border border-muted"
            :ui="{
              tr: 'whitespace-nowrap',
            }"
          >
            <template #rowType-cell="{ row }">
              <UBadge :color="(row.original.rowType === 'prepayment' || row.original.rowType === 'rateAdjustment') ? 'primary' : 'neutral'" variant="subtle">
                <template v-if="row.original.rowType === 'prepayment'">
                  提前还款
                </template>
                <template v-else-if="row.original.rowType === 'normal'">
                  月供
                </template>
                <template v-else-if="row.original.rowType === 'rateAdjustment'">
                  调整利率
                </template>
                <template v-else>
                  初始
                </template>
              </UBadge>
            </template>
            <template #repaymentDate-cell="{ row }">
              {{ row.original.repaymentDate ?? '-' }}
            </template>
            <template #rateAfter-cell="{ row }">
              <template v-if="row.original.rowType === 'rateAdjustment'">
                {{ formatMoney(row.original.rateBefore) }}% -> {{ formatMoney(row.original.rateAfter) }}%
              </template>
              <template v-else>
                {{ formatMoney(row.original.applicableRate) }}%
              </template>
            </template>
            <template #times-cell="{ row }">
              {{ row.original.times ?? '-' }}
            </template>
            <template #monthlyAmount-cell="{ row }">
              <span class="font-semibold">{{ formatMoney(row.original.monthlyAmount) }}</span>
            </template>
            <template #interestRepayment-cell="{ row }">
              {{ formatMoney(row.original.interestRepayment) }}
            </template>
            <template #principalRepayment-cell="{ row }">
              {{ formatMoney(row.original.principalRepayment) }}
            </template>
            <template #remainingPrincipal-cell="{ row }">
              {{ formatMoney(row.original.remainingPrincipal) }}
            </template>
          </UTable>
        </ContainerToolItem>
      </div>
    </div>
  </div>
</template>
