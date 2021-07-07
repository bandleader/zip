<template>
  <div>
    <layout-header v-if="!noheader" />
    <main class="container" style="margin: 2em 0">
      <slot />
    </main>
  </div>
</template>  

<script>
// Simple function to toggle a Bootstrap 4 navbar without Boostrap JS or even jQuery. Simplified from codepen.io/jasonbutz/pen/yPodOE
function toggleBootstrapNavbar(targetEl) {
  var cl = targetEl.classList
  var isShown = cl.contains("show") || cl.contains("collapsing")
  if (isShown) { 
    targetEl.style.height = targetEl.getBoundingClientRect().height + "px"
    targetEl.offsetHeight // force reflow
  }
  cl.add("collapsing")
  cl.remove("collapse")
  cl.remove(isShown ? "show" : "collapsed")
  targetEl.style.height = isShown ? '' : targetEl.scrollHeight + "px"
  setTimeout(function () {
      cl.remove("collapsing");
      cl.add("collapse")
      if (!isShown) {
        cl.add("show")
        targetEl.style.height = ""
      }
  }, 350)
}

export default {
  props: { 
    noheader: { type: Boolean, default: false }
  },
  methods: {
    toggleNavBar() { toggleBootstrapNavbar(document.querySelector('.navbar-collapse')) }
  }
}
</script>