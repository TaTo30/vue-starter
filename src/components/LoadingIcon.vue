<script lang="ts" setup>
const props = defineProps<{ dense?: boolean }>()

</script>


<template>
  <div
    :class="[
      'inline-block animate-spin rounded-full border-solid border-current border-r-transparent opacity-50',
      props.dense ? 'h-5 w-5 border-2' : 'h-8 w-8 border-4'
    ]"
    role="status"
  >
    <span class="sr-only">Loading...</span>
  </div>
</template>
