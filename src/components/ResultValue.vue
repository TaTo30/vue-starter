<script setup lang="ts">
import type { CrossrefWorkItem } from '@/vite-env';
import { computed } from 'vue';


const props = defineProps<{
  item: CrossrefWorkItem
}>()

const authorList = computed(() => { 
  if (props.item.author?.length === 0) return ""
  return props.item.author?.map(a => `${a.given} ${a.family}`).join(" · ")
})

const publishedDate = computed(() => {
  const dateParts = props.item.published?.['date-parts']?.[0]
  if (!dateParts) return ""


  return Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" })
    .format(
      new Date(dateParts[0], dateParts[1], dateParts[2])
    )
})

</script>

<template>
  <div class="space-y-4">
    <div
      class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
    >
      <h3 class="text-base font-semibold text-gray-900">
        {{ props.item.title?.[0] || '' }}
      </h3>
      <p class="text-sm text-gray-500 mt-1">
        {{ authorList }} · {{ publishedDate }}
      </p>
      <p class="text-sm text-gray-600 mt-2">
        <a
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
