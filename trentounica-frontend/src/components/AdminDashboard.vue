<template>
  <div class="admin-container">
    <div class="admin-box">
      <!-- Bottone indietro -->
      <button class="back-button" @click="$router.back()">← Torna indietro</button>

      <h2>Dashboard Amministratore</h2>

      <ul class="organizer-list">
        <li v-for="organizer in organizers" :key="organizer._id" class="organizer-item">
          <div class="organizer-info">
            <strong>{{ organizer.companyName || organizer.name }}</strong>
            <span>{{ organizer.email }}</span>
          </div>
          <button @click="verifyOrganizer(organizer._id)" class="verify-btn">Verifica</button>
        </li>
      </ul>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import axios from "@/api/axios";

export default {
  name: "AdminDashboard",
  data() {
    return {
      organizers: [],
      errorMessage: ""
    };
  },
  async created() {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/users/organizers/pending", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      this.organizers = response.data;
    } catch (error) {
      console.error("Errore durante il caricamento degli organizzatori:", error.response || error);
      this.errorMessage = error.response?.data?.message || "Errore durante il caricamento degli organizzatori";
    }
  },
  methods: {
    async verifyOrganizer(userId) {
      try {
        const token = localStorage.getItem("token");
        await axios.put(`/users/verify/${userId}`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.organizers = this.organizers.filter(org => org._id !== userId);
        alert("Organizzatore verificato con successo");
      } catch (error) {
        console.error("Errore durante la verifica dell'organizzatore:", error.response || error);
        this.errorMessage = error.response?.data?.message || "Errore durante la verifica";
      }
    }
  }
};
</script>

<style scoped>
.admin-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.admin-box {
  position: relative;
  background-color: white;
  padding: 40px;
  border-radius: 10px;
  width: 100%;
  max-width: 700px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.back-button {
  position: absolute;
  top: 15px;
  left: 15px;
  background: transparent;
  border: none;
  color: #2e7d32;
  font-size: 14px;
  cursor: pointer;
}

.back-button:hover {
  text-decoration: underline;
}

h2 {
  margin-bottom: 20px;
  color: #2e7d32;
  text-align: center;
}

.organizer-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.organizer-item {
  background-color: #f1f1f1;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.organizer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.verify-btn {
  background-color: #2e7d32;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.verify-btn:hover {
  background-color: #1b5e20;
}

.error-message {
  margin-top: 20px;
  color: red;
  text-align: center;
  font-size: 14px;
}
</style>
