<template>
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
          <login-section />
        </div>
      </nav>
    </div>
  </header>
</template>