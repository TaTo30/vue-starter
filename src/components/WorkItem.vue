<script setup lang="ts">
import { computed } from 'vue';
import { useChangeCase } from "@vueuse/integrations/useChangeCase";

import type { CrossrefWorkItem } from '@/vite-env';

const props = defineProps<{
  item: CrossrefWorkItem
}>()

const authorList = computed(() => { 
  if (!props.item.author || props.item.author.length === 0) return ""


  return props.item.author.map(a => {
    const given = a.given || ""
    const family = a.family || ""
    const givenFamily =  `${given} ${family}`.trim()

    return givenFamily || a.name || ""
    
  })
  .filter(e => e !== "")
  .join(" | ")
})

const publishedDate = computed(() => {
  const dateParts = props.item.published?.['date-parts']?.[0]
  if (!dateParts) return ""

  const dateInst = new Date(dateParts[0], (dateParts[1] || 1) - 1, dateParts[2] || 1)
  return Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric" })
    .format(dateInst)
})

const containerTitle = computed(() => {
  if (!props.item['container-title'] || props.item['container-title'].length === 0) return ""
  return `in ${props.item['container-title'][0]}`
})

const itemType = computed(() => {
  return useChangeCase(props.item.type || "", "capitalCase")
})

</script>

<template>
  <div class="space-y-4">
    <div
      class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
    >
      <h3 class="text-xl font-semibold text-gray-900">
        {{ props.item.title?.[0] || '' }}
      </h3>
      <p class="text-md text-gray-500 mt-1">
        <strong> {{ itemType }}</strong> published {{ publishedDate }} {{ containerTitle }}
      </p>
      <p
        v-if="authorList"
        class="text-sm mt-1"
      >
        Authors: {{ authorList }}
      </p>
      <p class="text-sm text-gray-600 mt-2">
        <a
          tabindex="0"
          class="text-blue-500 no-underline"
          :href="props.item.URL"
          target="blank"
          rel="noopener noreferrer"
        > 
          {{ props.item.URL }}
        </a>
      </p>
    </div>
  </div>
</template>
