<script setup lang="ts">
import { ref, watch } from 'vue';

import useCrossrefFilters from '@/composables/crossref-filters';

import type { CrossrefFacet } from '@/vite-env';

const props = defineProps<{ facets: Record<string, CrossrefFacet> }>()
const model = defineModel<string[][]>()

const { formatFilterValue } = useCrossrefFilters()

const selectedValues = ref<Record<string, boolean>>({})
const showMore = ref<Record<string, boolean>>({})

function onFacetClick(facet: string, key: string) {
  const filter = formatFilterValue(facet, key.toString())

  if (selectedValues.value[key]) {
    selectedValues.value[key] = false
    model.value = model.value?.filter(f => f[0] !== filter[0] || f[1] !== filter[1])
    return
  }

  selectedValues.value[key] = true
  model.value?.push(filter)
}

function sortFacetValues(values: Record<string, number>) {
  return Object.entries(values).sort((a, b) => b[1] - a[1])
}

watch(model, () => {
  selectedValues.value = {}
  for (const item of  model.value || []) {
    selectedValues.value[item[1]] = true
  }
})
</script>

<template>
  <aside class="space-y-6">
    <div
      v-for="(facet, facetKey) in props.facets"
      :key="facetKey"
    >
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
        {{ facetKey }}
      </h3>
      <ul class="space-y-1 select-none">
        <li
          v-for="entry in sortFacetValues(facet.values || {}).slice(0, showMore[facetKey] ? undefined : 10)"
          :key="entry[0]"
          :aria-selected="selectedValues[entry[0]] ? 'true' : 'false'"
          class="flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 cursor-pointer px-2 py-1 rounded hover:bg-gray-100 aria-selected:bg-blue-100 aria-selected:hover:bg-blue-200 aria-selected:text-blue-700 "
          @click="onFacetClick(facetKey, entry[0])"
        >
          <span>{{ entry[0] }}</span>
          <span class="text-xs text-gray-400 ">{{ entry[1] }}</span>
        </li>
      </ul>
      <button
        v-if="sortFacetValues(facet.values || {}).length > 10 && !showMore[facetKey]"
        class="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 cursor-pointer"
        @click="showMore[facetKey] = true"
      >
        Show all
      </button>
    </div>
  </aside>
</template>
