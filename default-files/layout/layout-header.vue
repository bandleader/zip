<template>
  <header>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <router-link class="navbar-brand" to="/">{{$root.siteBrand}}</router-link>
        <button class="navbar-toggler" type="button" data-toggle="collapse" aria-expanded="false" aria-label="Toggle navigation" @click="toggleNavBar()">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto mr-auto"><!-- margins with both bs4 and bs5 syntax -->
            <li class="nav-item" v-for="i in $root.navMenuItems" @click="toggleNavBar(false)">
              <router-link class="nav-link" :to="i.url" active-class="active">{{i.text}}</router-link>
            </li>
          </ul>
          <span class="d-flex justify-content-right justify-content-end">
            <login-section />
          </span>
        </div>
      </div>
    </nav>
  </header>
</template>

<script>
export default {
  methods: {
    toggleNavBar(action) { toggleBootstrapNavbar(document.querySelector('.navbar-collapse'), action) }
  }  
}

// Simple function to toggle a Bootstrap 4 navbar without Boostrap JS or even jQuery. Simplified from codepen.io/jasonbutz/pen/yPodOE
function toggleBootstrapNavbar(targetEl, action = 'toggle') {
  // action can be true, false, or 'toggle' (default)
  var cl = targetEl.classList
  var isShown = cl.contains("show") || cl.contains("collapsing")
  var shouldShow = action === 'toggle' ? !isShown : !!action
  if (isShown === shouldShow) return;

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
</script>