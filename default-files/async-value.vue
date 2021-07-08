<template>
    <span :is="tag||'span'" :style="tag ? null : 'display: contents'" v-if="info.resolved"><slot v-bind="{value: info.value}" /></span>
    <span :is="tag||'span'" :style="tag ? null : 'display: contents'" v-else-if="info.error" class="text-danger"><i class="fa fa-exclamation-triangle" /> {{info.error}}</span>
    <span :is="tag||'span'" :style="tag ? null : 'display: contents'" v-else><span class="spinner-border text-primary" /></span>
</template>

<script>
export default {
  props: ['promise', 'tag'],
  computed: {
    info() {
      const ret = Vue.observable({
        resolved: false,
        error: null,
        value: null
      })
      let promise = this.promise
      if (typeof promise === 'function') promise = promise()
      if (typeof promise !== 'object' || typeof promise.then !== 'function') throw "<async-value>: prop 'promise' must be a Promise/PromiseLike or a function returning one; got: " + typeof promise
      promise.then(x => {ret.resolved = true; ret.value = x}, err => ret.error = err)
      return ret
    }
  }  
}
</script>