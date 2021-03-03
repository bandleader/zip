<template>
  <div>
    <h3>Welcome to {{$root.siteBrand}}!</h3>
    <p>Click <router-link to="/about">here</router-link> to learn more about our site.</p>
  </div>
</template>  

<script>
export default { 
  pageTitle: "Home",
  data: () => ({
  })
}
</script>