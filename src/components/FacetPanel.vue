<script setup lang="ts">
import { computed,  ref } from 'vue';
import { useChangeCase } from "@vueuse/integrations/useChangeCase";

import useCrossrefFilters from '@/composables/crossref-filters';

import type { CrossrefFacet } from '@/vite-env';

const props = defineProps<{ facets: Record<string, CrossrefFacet> }>()
const model = defineModel<string[][]>()

const { formatFilterValue, getFacetKey, singleSelection } = useCrossrefFilters()

const showMore = ref<Record<string, boolean>>({})

const selectedValues = computed(() => {
  const selected: Record<string, boolean> = {}
  for (const item of model.value || []) {
    const facetKey = getFacetKey(item[0])
    const compositeKey = `${facetKey}:${item[1]}`
    selected[compositeKey] = true
  }
  return selected
})


function onFacetClick(facet: string, key: string) {
  function removeFacetFilter(filter: string, value: string) {
      const index = model.value?.findIndex(m => m[0] === filter && m[1] === value)
      if (index !== undefined && index >= 0) {
        model.value?.splice(index, 1)
      }
  }

  const compositeKey = `${facet}:${key}`
  const filter = formatFilterValue(facet, key.toString())

  if (selectedValues.value[compositeKey]) {
    // If already selected, remove it from the model
    filter.forEach(filterItem => {
      removeFacetFilter(filterItem[0], filterItem[1])
    })
    return
  }

  // Check if the facet is for single selection and remove existing selection if necessary
  if (singleSelection(facet)) { 
    // Selected values has facet:value key format, we need to use
    // <facet> part to compute the filters using formatFilterValue and for each
    // filter item, remove it from the model
    const facetKeys = Object.keys(selectedValues.value).filter(k => k.startsWith(`${facet}:`))
    facetKeys.forEach(facetKey => {
      const [facet, value] = facetKey.split(":")
      const filterValue = formatFilterValue(facet, value)
        filterValue.forEach(filterItem => {
          removeFacetFilter(filterItem[0], filterItem[1])
      })
    })
  }

  model.value?.push(...filter)
}

function sortFacetValues(values: Record<string, number>) {
  return Object.entries(values).sort((a, b) => b[1] - a[1])
}
</script>

<template>
  <aside class="space-y-6">
    <div
      v-for="(facet, facetKey) in props.facets"
      :key="facetKey"
    >
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
        {{ useChangeCase(facetKey, "capitalCase") }}
      </h3>
      <ul class="space-y-1 select-none ">
        <li
          v-for="(entry, index) in sortFacetValues(facet.values || {})"
          :key="entry[0]"
          :aria-selected="selectedValues[`${facetKey}:${entry[0]}`] ? 'true' : 'false'"
          :aria-expanded="showMore[facetKey]"
          :class="{'hidden': !showMore[facetKey] && index > 10}"
          class="flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 cursor-pointer px-2 py-1 rounded hover:bg-gray-100 aria-selected:bg-blue-100 aria-selected:hover:bg-blue-200 aria-selected:text-blue-700 "
          @click="onFacetClick(facetKey, entry[0])"
        >
          <span>{{ entry[0] }}</span>
          <span class="text-xs text-gray-400 ">{{ entry[1] }}</span>
        </li>
      </ul>
      <button
        v-if="!showMore[facetKey] && Object.keys(facet.values || {}).length > 10"
        class="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 cursor-pointer"
        @click="showMore[facetKey] = true"
      >
        Show all ({{ Object.keys(facet.values || {}).length }})
      </button>
    </div>
  </aside>
</template>
