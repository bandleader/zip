<template>
  <div>
    <h3>About</h3>
    <p>To get a greeting and test RPC, enter your name and click the button below.</p>
    <p>
      <input v-model="name" class="form-control">
      <br>
      <button type="button" class="btn btn-primary" @click="greet">RPC Greeting</button>
    </p>
  </div>
</template>  

<script>
export default { 
  pageTitle: "About",
  menuLink: true,
  data: () => ({
    name: "world"
  }),
  methods: {
    async greet() { 
      const rpcResult = await App.backend.greeting({name: this.name})
      alert(rpcResult) 
    }
  }
}
</script>