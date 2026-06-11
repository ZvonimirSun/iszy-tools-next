<script setup lang="ts">
import { formatBytes } from './children/cdnQuery.utils'
import CdnQueryPackageDetail from './children/CdnQueryPackageDetail.vue'
import CdnQueryResultList from './children/CdnQueryResultList.vue'
import CdnQuerySearchPanel from './children/CdnQuerySearchPanel.vue'
import { useCdnQuery } from './children/useCdnQuery'

const {
  keyword,
  loading,
  detailLoading,
  errorMessage,
  pageIndex,
  count,
  result,
  status,
  pkgID,
  pkgData,
  version,
  versions,
  defaultFile,
  flatFiles,
  maxPage,
  hasPrevPage,
  hasNextPage,
  versionOptions,
  pageSize,
  search,
  searchByOwner,
  showDetail,
  getVersionData,
  copyLink,
  openLink,
  clearDetail,
  buildCdnUrl,
} = useCdnQuery()
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <CdnQuerySearchPanel
      :keyword="keyword"
      :loading="loading"
      :error-message="errorMessage"
      @update:keyword="keyword = $event"
      @search="search(0)"
    />

    <CdnQueryResultList
      v-if="status === 'done' && !pkgID"
      :result="result"
      :count="count"
      :page-index="pageIndex"
      :max-page="maxPage"
      :page-size="pageSize"
      :loading="loading"
      :has-prev-page="hasPrevPage"
      :has-next-page="hasNextPage"
      @show-detail="showDetail"
      @search-owner="searchByOwner"
      @change-page="search"
    />

    <CdnQueryPackageDetail
      v-if="pkgID"
      :pkg-i-d="pkgID"
      :pkg-data="pkgData"
      :detail-loading="detailLoading"
      :versions="versions"
      :version="version"
      :version-options="versionOptions"
      :default-file="defaultFile"
      :flat-files="flatFiles"
      :format-bytes="formatBytes"
      :create-cdn-url="buildCdnUrl"
      @back="clearDetail"
      @refresh="showDetail"
      @update:version="version = $event"
      @version-change="getVersionData"
      @copy-link="copyLink"
      @open-link="openLink"
    />
  </div>
</template>
