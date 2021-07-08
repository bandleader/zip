<template>
  <div>
    <layout-header v-if="!noheader" />
    <main class="container py-3" style="min-height: calc(100vh - 20.1em) /* to keep footer (if shown) closer to the bottom */">
      <slot />
    </main>
    <layout-footer v-if="!nofooter" />
  </div>
</template>  

<script>
export default {
  props: { 
    noheader: { type: Boolean, default: false },
    nofooter: { type: Boolean, default: false }
  }  
}
</script>