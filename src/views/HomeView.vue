<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'

import { onBeforeMount, ref, useTemplateRef, watch } from 'vue';
import { useFetch, useIntersectionObserver, useMagicKeys, useStorage, watchDebounced } from '@vueuse/core';

import FacetItem from '@/components/FacetItem.vue';
import ResultValue from '@/components/ResultValue.vue';
import LoadingIcon from '@/components/LoadingIcon.vue';

import useCrossrefApi from '@/composables/crossref-api';

import type { CrossrefFacet, CrossrefResponse, CrossrefWorkItem } from '@/vite-env';

const { url, defaultSelect, defaultFacet, defaultRows } = useCrossrefApi()

const { Ctrl_K } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.ctrlKey && e.key === 'k' && e.type=== 'keydown')
      e.preventDefault()   
  }
})

const searchInput = useTemplateRef("searchInput")
const onLoadSentile = useTemplateRef("onLoadSentile")

const facetStored = useStorage<Record<string, CrossrefFacet>>("facets", {}, sessionStorage)
const cursorStored = useStorage<string>("cursor", "*", sessionStorage)

const query = useRouteQuery<string>("q", "");
const filters = useRouteQuery<string>("filters", "")

const workItems = ref<CrossrefWorkItem[]>([])
const searchUrl = ref("")
const facetSelected = ref<string[][]>(
  filters.value.split(",").filter(e => !!e).map(f => {
    const [key, value] = f.split(":")
        return [key, value]
  })
)

const { execute, data, isFetching } = useFetch<CrossrefResponse>(
  searchUrl,
  {
    immediate: false,
    afterFetch(ctx) {
      const url = new URL(ctx.context.url)
      if (url.searchParams.has("facet")) {
        if (ctx.data?.message.facets) {
          facetStored.value = ctx.data.message.facets
        }
      }

      if (url.searchParams.get("cursor") === "*") {
        workItems.value = ctx.data?.message.items || []
        cursorStored.value = ctx.data?.message["next-cursor"] || "*"
      } else {
        workItems.value.push(...(ctx.data?.message.items || []))
      }

      return ctx
    }
  },
)
.get()
.json()

useIntersectionObserver(onLoadSentile, ([entry]) => {
  if (entry.isIntersecting && !isFetching.value)
    onLoadMore()
})

async function fetchFacets() {
  const urlSearchParams = new URLSearchParams([
    ["rows", "0"],
    ["select", defaultSelect],
    ["query", query.value],
    ["facet", defaultFacet]
  ])

  const endpoint = url("works", urlSearchParams)
  const response = await fetch(endpoint)
  const data = await response.json() as CrossrefResponse

  facetStored.value = data.message.facets || {}
}

async function onLoadMore() {
  if (cursorStored.value === "*")
    return

  if (data.value.message.items.length < defaultRows) {
    console.warn("All results have been loaded")
    return
  }

  const currentUrl = new URL(searchUrl.value)
  const urlSearchParams = currentUrl.searchParams
  urlSearchParams.set("cursor", cursorStored.value)
  urlSearchParams.delete("facet") // Do not request facets when loading more results
  searchUrl.value = url("works", urlSearchParams)
  execute()
}

async function onSearch(mode: "querying" | "filtering" | "initial" = "querying") {
  const urlSearchParams = new URLSearchParams([
    ["rows", defaultRows],
    ["select", defaultSelect],
    ["query", query.value]
  ])

  // We will request facets in another call when user is reloading page with filters
  if (mode === "initial" && filters.value) {
    fetchFacets()
  }

  if (filters.value && (mode === "filtering" || mode === "initial")) {
    urlSearchParams.append("filter", filters.value)
  }

  if (mode === "querying") {
    facetSelected.value = []
    filters.value = ""
    urlSearchParams.append("facet", defaultFacet)
  }

  urlSearchParams.append("cursor", "*")
  searchUrl.value = url("works", urlSearchParams)
  execute()
}

watchDebounced(
  facetSelected,
  () => {
    filters.value = facetSelected.value.map(f => `${f[0]}:${f[1]}`).join(",")
    onSearch("filtering")
  },
  {
    debounce: 1300,
    deep: true,
    immediate: false
  }
)

watch(Ctrl_K, () => {
  searchInput.value?.focus()
})

onBeforeMount(() => {
  // Mounted hook is useful for reloading cases
  if (query.value) {
    onSearch("initial")
  }

  searchInput.value?.focus()
})
</script>

<template>
  <div class="flex flex-col h-screen">
    <header class="flex items-center justify-between px-6 py-3 border-b border-gray-200 shrink-0">
      <div class="flex items-center gap-2">
        <img
          src="https://assets.crossref.org/logo/crossref-logo-landscape-200.png"
          alt="Crossref Logo"
          class="h-12"
        >
      </div>

      <div class="flex-1 max-w-xl mx-6">
        <div class="relative">
          <input
            ref="searchInput"
            v-model="query"
            tabindex="0"
            type="text"
            placeholder="Title, author, DOI, ORCID iD, etc."
            class="w-full rounded-md border border-gray-300 px-4 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @keydown.enter="onSearch('querying')"
          >
          <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none inline-flex items-center space-x-2">
            <LoadingIcon
              v-if="isFetching"
              dense
            />
            <kbd class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              Ctrl K
            </kbd>
          </div>
        </div>
        <p class="mt-2 text-xs text-gray-400 text-right">
          Press <kbd class="rounded border border-gray-300 bg-gray-100 px-1 text-xs">Enter</kbd> to search
        </p>
      </div>

      <nav class="flex items-center gap-4 text-sm text-gray-600">
        <a
          href="#"
          class="hover:text-gray-900"
        >
          Support
        </a>
      </nav>
    </header>

    <div
      ref="resultContainer"
      class="flex-1 overflow-y-auto"
    >
      <div>
        <div
          v-if="!data"
          class="flex items-center justify-center h-full"
        >
          <p class="text-gray-400 text-lg">
            Start by searching above to see results here.
          </p>
        </div>

        <div v-else>
          <div
            class="flex h-full"
          >
            <div class="w-[15%] border-r border-gray-200 p-4 overflow-y-auto">
              <FacetItem
                v-model="facetSelected"
                :facets="facetStored"
              />
            </div>
  
            <div class="w-[85%] p-4 overflow-y-auto">
              <div
                v-if="isFetching && cursorStored === '*'"
                class="mb-2 mt-8 text-center flex flex-col items-center gap-2 justify-center"
              >
                <LoadingIcon />
                <span class="opacity-50">Loading results...</span>
              </div>
              <div
                v-else
                class="space-y-2"
              >
                <div class="text-gray-500 font-bold text-right">
                  {{ data?.message?.["total-results"] || 0 }} Results
                </div>
                <ResultValue
                  v-for="(item, index) in workItems"
                  :key="index"
                  :item="item"
                />
                <div
                  ref="onLoadSentile"
                  class="h-1"
                />
                <div
                  v-if="isFetching && cursorStored !== '*'"
                  class="mb-2 mt-8 text-center flex flex-col items-center gap-2 justify-center"
                >
                  <LoadingIcon />
                  <span class="opacity-50">Loading more results...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
