<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'

import FacetItem from '@/components/FacetItem.vue';
import ResultValue from '@/components/ResultValue.vue';
import { onBeforeMount, ref, useTemplateRef, watch } from 'vue';
import { useFetch, useMagicKeys, useStorage, watchDebounced } from '@vueuse/core';

import type { CrossrefFacet, CrossrefResponse } from '@/vite-env';

const { Ctrl_K } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.ctrlKey && e.key === 'k' && e.type=== 'keydown')
      e.preventDefault()   
  }
})

const searchInput = useTemplateRef("searchInput")

const facetStored = useStorage<Record<string, CrossrefFacet>>("facets", {}, sessionStorage)
// const cursorStored = useStorage<string>("cursor", "*", sessionStorage)

const query = useRouteQuery<string>("q", "");
const filters = useRouteQuery<string>("filters", "")

const facetSelected = ref<string[][]>(
  filters.value.split(",").map(f => {
    const [key, value] = f.split(":")
        return [key, value]
  })
)
const searchUrl = ref("")

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
      return ctx
    }
  },
)
.get()
.json()


async function fetchFacets() {
  const urlSearchParams = new URLSearchParams([
    ["rows", "0"],
    ["select", "author,ISBN,container-title,URL,title,type,published-print,issued"],
    ["query", query.value],
    ["facet", "type-name:*,published:*"]
  ])

  const url = `https://api.crossref.org/works?${urlSearchParams.toString()}`
  const response = await fetch(url)
  const data = await response.json() as CrossrefResponse

  facetStored.value = data.message.facets || {}
}

async function onSearch(mode: "querying" | "filtering" | "both" = "querying") {
  const urlSearchParams = new URLSearchParams([
    ["rows", "20"],
    ["select", "author,ISBN,container-title,URL,title,type,published-print,issued"],
    ["query", query.value]
  ])

  // We will request facets in another call when user is reloading page with filters
  if (mode === "both") {
    fetchFacets()
  }

  // Do not allow trigger an http request for filtering if there is no filters
  if (!filters.value && mode === "filtering")
    return

  if (filters.value && (mode === "filtering" || mode === "both")) {
    urlSearchParams.append("filter", filters.value)
  }

  if (mode === "querying") {
    facetStored.value = {}
    facetSelected.value = []
    filters.value = ""
    urlSearchParams.append("facet", "type-name:*,published:*")
  }

  searchUrl.value = `https://api.crossref.org/works?${urlSearchParams.toString()}`
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
    if (filters.value) {
      onSearch("both")
    } else {
      onSearch("querying")
    }
  }
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
            type="text"
            placeholder="Title, author, DOI, ORCID iD, etc."
            class="w-full rounded-md border border-gray-300 px-4 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @keydown.enter="onSearch('querying')"
          >
          <kbd class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none inline-flex items-center gap-0.5 rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
            Ctrl K
          </kbd>
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
          Docs
        </a>
        <a
          href="#"
          class="hover:text-gray-900"
        >
          Blog
        </a>
        <a
          href="#"
          class="hover:text-gray-900"
        >
          Support
        </a>
      </nav>
    </header>

    <div class="flex-1 overflow-y-auto">
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
              <div v-if="isFetching">
                <p class="text-gray-400 text-lg text-center py-20">
                  Loading results...
                </p>
              </div>
              <div v-else>
                <ResultValue
                  v-for="(item, index) in data.message.items"
                  :key="index"
                  :item="item"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
