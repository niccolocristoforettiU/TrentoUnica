<template>
  <div>
    <h2>Dashboard Admin</h2>
    <ul>
      <li v-for="organizer in organizers" :key="organizer._id">
        {{ organizer.name }} - {{ organizer.email }}
        <button @click="verifyOrganizer(organizer._id)">Verifica</button>
      </li>
    </ul>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
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
        this.errorMessage = error.response?.data?.message || "Errore durante la verifica";
      }
    }
  }
};
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}
</style>
