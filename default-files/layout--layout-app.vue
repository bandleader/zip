<template>
  <div>
    <header>
      <div class="bs-component">
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
          <router-link class="navbar-brand" to="/">{{$root.siteBrand}}</router-link>
          <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarColor01" aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation" @click="toggleNavBar">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse">
            <ul class="navbar-nav mr-auto">
              <li class="nav-item" v-for="i in $root.navMenuItems">
                <router-link class="nav-link" :to="i.url">{{i.text}}</router-link>
              </li>
            </ul>
            <!--<form class="form-inline my-2 my-lg-0">
              <input class="form-control mr-sm-2" type="text" placeholder="Search">
              <button class="btn btn-secondary my-2 my-sm-0" type="submit">Search</button>
            </form>-->
            <login-section />
            <!-- <button class="btn btn-primary" v-if="!$root.deviceState.user" @click="$root.App.identity.showLogin">Log in</button> -->
            <!-- <span class="d-inline-block text-right" style="font-size: 1.5em" v-else>
              <i class="fa fa-user-circle" style="font-size: 1.2em"></i>
              <b>{{$root.deviceState.user.name || 'Anonymous'}}</b>
              <br>
              <button type="button" class="btn btn-sm bg-white" style="opacity: 0.7" href="javascript:void(0)" @click="$root.App.identity.logout">Log out</button>
            </span> -->
          </div>
        </nav>
      </div>
    </header>
    <main class="container" style="min-height: calc(100vh - 248px); margin: 2em 0">
      <slot />
    </main>
    <footer style="padding: 1em; margin-top: 1em; background: #444" class="text-light">
      <h5><router-link to="/" class="text-light">© {{$root.siteBrand}} 2020</router-link></h5>
      <p class="text-muted">Another great thing made with Zip</p>
      <p v-if="$root.deviceState.user">Logged in as <b>{{$root.deviceState.user.name || 'Anonymous'}}</b> -- <a href="javascript:void(0)" @click="$root.App.identity.logout">log out</a></p>
      <p v-else><a href="javascript:void(0)" @click="$root.App.identity.showLogin">Log in</a></p>
    </footer>
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
  methods: {
    toggleNavBar() { toggleBootstrapNavbar(document.querySelector('.navbar-collapse')) }
  }
}
</script>