<template>
  <div>
    <h1>Benvenuto in TrentoUnica</h1>
    <nav>
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li v-if="!isAuthenticated"><router-link to="/login">Login</router-link></li>
        <li v-if="!isAuthenticated"><router-link to="/register">Registrati</router-link></li>
        <li v-if="role === 'client'"><router-link to="/client/dashboard">Dashboard Client</router-link></li>
        <li v-if="role === 'organizer'"><router-link to="/organizer/dashboard">Dashboard Organizer</router-link></li>
        <li v-if="role === 'admin'"><router-link to="/admin/dashboard">Dashboard Admin</router-link></li>
      </ul>
    </nav>
    <button v-if="isAuthenticated" @click="logout">Logout</button>
  </div>
</template>

<script>
export default {
  name: "HomePage",
  computed: {
    isAuthenticated() {
      return !!localStorage.getItem('token');
    },
    role() {
      return localStorage.getItem('role');
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
nav ul {
  list-style: none;
  padding: 0;
}

nav ul li {
  display: inline-block;
  margin-right: 15px;
}

button {
  margin-top: 15px;
  padding: 10px 20px;
  background-color: #f44336;
  color: #fff;
  border: none;
  cursor: pointer;
}
</style>