<template>
  <div class="container">
    <!-- Navbar compatta -->
    <nav class="navbar">
      <div class="nav-left">
        <strong>TrentoUnica</strong>
      </div>
      <ul class="nav-links">
        <li><router-link to="/">Home</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/map">Mappa</router-link></li>
        <li v-if="!isAuthenticated"><router-link to="/login">Login</router-link></li>
        <li v-if="!isAuthenticated"><router-link to="/register">Registrati</router-link></li>
        <li v-if="role === 'client'"><router-link to="/client/dashboard">Dashboard Client</router-link></li>
        <li v-if="role === 'organizer'"><router-link to="/organizer/dashboard">Dashboard Organizer</router-link></li>
        <li v-if="role === 'organizer'"><router-link to="/organizer/create-event">Crea Evento</router-link></li>
        <li v-if="role === 'admin'"><router-link to="/admin/dashboard">Dashboard Admin</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/searchbar">Cerca Eventi</router-link></li>
        <li v-if="isAuthenticated"><router-link to="/Appcalendar">Calendario</router-link></li>
      </ul>
      <div v-if="isAuthenticated">
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </nav>

    <!-- Contenuto principale -->
    <main class="welcome-section">
      <h1>Benvenuto {{ userName }} in TrentoUnica</h1>
      <p>Esplora gli eventi, scopri le mappe o accedi alla tua area personale.</p>
    </main>
  </div>
</template>

<script>
import axios from "@/api/axios";

export default {
  name: "HomePage",
  data() {
    return {
      isAuthenticated: !!localStorage.getItem('token'),
      userName: localStorage.getItem('name') || "",
      role: localStorage.getItem('role') || "",
      organizerEvents: []
    };
  },
  mounted() {
    if (this.role === 'organizer') {
      const token = localStorage.getItem('token');
      axios.get('/events/organizer', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        this.organizerEvents = response.data;
      })
      .catch(err => {
        console.error('Errore nel caricamento eventi organizer:', err);
      });
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      this.isAuthenticated = false;
      this.userName = "";
      this.role = "";
    }
  }
};
</script>


<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2e7d32;
  color: white;
  padding: 15px 30px;
  flex-wrap: wrap;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-links li a {
  color: white;
  text-decoration: none;
  font-weight: 500;
}

.nav-links li a:hover {
  text-decoration: underline;
}

.logout-btn {
  background-color: #c62828;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.logout-btn:hover {
  background-color: #b71c1c;
}

/* Contenuto centrale */
.welcome-section {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
}

.welcome-section h1 {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #333;
}

.welcome-section p {
  font-size: 1.1rem;
  color: #555;
}
</style>
