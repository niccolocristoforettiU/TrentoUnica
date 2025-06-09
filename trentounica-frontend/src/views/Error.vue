<template>
  <div class="error-page">
    <h1>Oops! Qualcosa è andato storto</h1>
    <p>{{ message }}</p>
    <router-link to="/" class="btn-home">Torna alla Home</router-link>
  </div>
</template>

<script>
export default {
  name: "ErrorPage",
  computed: {
    message() {
      return this.$route.query.message || "Si è verificato un errore imprevisto.";
    }
  }
};
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #fbe9e7;
  color: #b71c1c;
  text-align: center;
  padding: 40px;
}
.btn-home {
  margin-top: 20px;
  background-color: #2e7d32;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
}
.btn-home:hover {
  background-color: #1b5e20;
}
</style>
