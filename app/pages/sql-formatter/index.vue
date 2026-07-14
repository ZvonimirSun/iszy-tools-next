<script setup lang="ts">
import type { SqlLanguage } from 'sql-formatter'
import type { SqlFormatterOptions } from './children/sqlFormatter.service'
import { formatSql } from './children/sqlFormatter.service'

const sampleSql = `select u.id,u.name,count(o.id) as order_count
from users u
left join orders o on o.user_id = u.id
where u.status = 'active'
group by u.id,u.name
order by order_count desc;`

const inputText = ref(sampleSql)
const language = ref<SqlLanguage>('postgresql')
const keywordCase = ref<'preserve' | 'upper' | 'lower'>('upper')
const indentStyle = ref<SqlFormatterOptions['indentStyle']>('standard')
const tabWidth = ref(2)
const useTabs = ref(false)
const { copy } = useCopy()

const languageOptions = [
  { label: 'Standard SQL', value: 'sql' },
  { label: 'GCP BigQuery', value: 'bigquery' },
  { label: 'IBM DB2', value: 'db2' },
  { label: 'Apache Hive', value: 'hive' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'SQLite', value: 'sqlite' },
  { label: 'MariaDB', value: 'mariadb' },
  { label: 'SQL Server', value: 'transactsql' },
  { label: 'Oracle PL/SQL', value: 'plsql' },
  { label: 'Couchbase N1QL', value: 'n1ql' },
  { label: 'Amazon Redshift', value: 'redshift' },
  { label: 'Snowflake', value: 'snowflake' },
  { label: 'Spark', value: 'spark' },
  { label: 'Trino', value: 'trino' },
]

const keywordCaseOptions = [
  { label: '保持原样', value: 'preserve' },
  { label: '大写关键字', value: 'upper' },
  { label: '小写关键字', value: 'lower' },
]
const indentStyleOptions = [
  { label: '标准缩进', value: 'standard' },
  { label: '表格式左对齐', value: 'tabularLeft' },
  { label: '表格式右对齐', value: 'tabularRight' },
]

const formatted = computed(() => {
  try {
    return {
      error: '',
      value: formatSql(inputText.value, {
        language: language.value,
        keywordCase: keywordCase.value,
        indentStyle: indentStyle.value,
        tabWidth: tabWidth.value,
        useTabs: useTabs.value,
      }),
    }
  }
  catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      value: '',
    }
  }
})

const outputText = computed(() => formatted.value.value)
const errorMessage = computed(() => formatted.value.error)

function clear() {
  inputText.value = ''
}

function fillExample() {
  inputText.value = sampleSql
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <div class="grid gap-3 md:grid-cols-5">
      <UFormField label="SQL 方言">
        <USelect v-model="language" :items="languageOptions" class="w-full" />
      </UFormField>
      <UFormField label="关键字大小写">
        <USelect v-model="keywordCase" :items="keywordCaseOptions" class="w-full" />
      </UFormField>
      <UFormField label="缩进宽度">
        <UInputNumber v-model="tabWidth" class="w-full" :min="1" :max="8" />
      </UFormField>
      <UFormField label="缩进风格">
        <USelect v-model="indentStyle" :items="indentStyleOptions" class="w-full" />
      </UFormField>
      <UFormField label="缩进方式">
        <USwitch v-model="useTabs" label="使用 Tab" class="pt-2" />
      </UFormField>
    </div>

    <ContainerToolItem label="待格式化 SQL">
      <UTextarea
        v-model="inputText"
        class="w-full font-mono"
        :rows="12"
        resize
        autofocus
        placeholder="请输入 SQL..."
      />
    </ContainerToolItem>

    <div class="flex flex-wrap gap-2">
      <UButton color="neutral" variant="outline" icon="i-lucide:file-input" @click="fillExample">
        示例
      </UButton>
      <UButton color="neutral" variant="outline" icon="i-lucide:trash-2" @click="clear">
        清空
      </UButton>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      icon="i-lucide:circle-alert"
      :title="errorMessage"
    />

    <ContainerToolItem label="格式化结果">
      <div class="flex flex-col gap-2">
        <UTextarea
          :model-value="outputText"
          class="w-full font-mono"
          :rows="12"
          resize
          readonly
          placeholder="格式化结果将显示在这里..."
        />
        <div class="flex justify-end">
          <UButton
            :disabled="!outputText"
            color="neutral"
            variant="outline"
            icon="i-lucide:copy"
            @click="copy(outputText)"
          >
            复制结果
          </UButton>
        </div>
      </div>
    </ContainerToolItem>
  </div>
</template>
