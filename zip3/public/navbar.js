const SessionArea = {
    data: () => ({
        session: Identity.session.value,
    }),
    created() {
        Identity.session.subscribe(x => this.session = x)
    },
    methods: {
        login() { Identity.login() },
        logout() { Identity.logout() },
    },
    template: `
    <template v-if="!session">
        <button class="btn btn-sm btn-light" type="button" @click="login">Login</button>
    </template>
    <span v-else class="d-inline-block">
        <i class="fa fa-user" /> {{session.email.split("@")[0]}}
        <br>
        <a href="javascript:void(0)" @click="logout" style="color: inherit">Log out</a>
    </span>
        `
}

export default {
    components: { SessionArea },
    template: `
<nav class="navbar navbar-expand-lg">
    <div class="container-fluid">
      <a class="navbar-brand" href="#" style="color: inherit">{{$attrs.heading || 'Zip Example'}}</a>
      <span class="d-inline-block">
        <session-area />
      </span>
      <!--<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarColor01" aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
  
      <div class="collapse navbar-collapse" id="navbarColor01">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a class="nav-link active" href="#">Home
              <span class="visually-hidden">(current)</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Features</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Pricing</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">About</a>
          </li>
        </ul>
      </div>
      -->
    </div>
  </nav>
  `,
}  