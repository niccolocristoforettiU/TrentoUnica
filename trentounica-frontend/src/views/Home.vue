<template>
  <div>
    <h1>Benvenuto a TrentoUnica</h1>
    <p>Esplora e scopri i migliori eventi!</p>
    <router-link v-if="!isAuthenticated" to="/register">Registrati</router-link>
    <router-link v-if="!isAuthenticated" to="/login">Accedi</router-link>
    <router-link v-if="isAuthenticated" to="/profile">Il Mio Profilo</router-link>
  </div>
</template>

<script>
export default {
  name: "HomePage",
  computed: {
    isAuthenticated() {
      return !!localStorage.getItem("token");
    },
  },
};
</script>