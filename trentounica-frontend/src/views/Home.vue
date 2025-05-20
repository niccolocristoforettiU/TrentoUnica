<template>
  <div>
    <h1>Benvenuto {{ userName }} in TrentoUnica</h1>
    <nav>
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/MapLocation">Mappa</router-link></li>
        <li v-if="!isAuthenticated"><router-link to="/login">Login</router-link></li>
        <li v-if="!isAuthenticated"><router-link to="/register">Registrati</router-link></li>
        <li v-if="role === 'client'"><router-link to="/client/dashboard">Dashboard Client</router-link></li>
        <li v-if="role === 'organizer'"><router-link to="/organizer/dashboard">Dashboard Organizer</router-link></li>
        <li v-if="role === 'organizer'"><router-link to="/organizer/create-event">Crea Evento</router-link></li>
        <li v-if="role === 'admin'"><router-link to="/admin/dashboard">Dashboard Admin</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/searchbar">Cerca Eventi</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/Appcalendar">Calendario Eventi</router-link></li>
      </ul>
    </nav>
    <button v-if="isAuthenticated" @click="logout">Logout</button>
  </div>
</template>

<script>
export default {
  name: "HomePage",
  data() {
    return {
      isAuthenticated: !!localStorage.getItem('token'),
      userName: localStorage.getItem('name') || "",
      role: localStorage.getItem('role') || ""
    };
  },
  methods: {
    logout() {
      // Rimuovi i dati dal localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');

      // Aggiorna lo stato locale
      this.isAuthenticated = false;
      this.userName = "";
      this.role = "";
    }
  }
};
</script>

<style scoped>
div {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;
}

nav ul {
  display: flex;
  justify-content: center;
  list-style: none;
  padding: 0;
}

nav ul li {
  display: inline-block;
  margin-right: 15px;
  font-size: 18px;
}

nav ul li.search-bar {
  margin-left: auto;
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