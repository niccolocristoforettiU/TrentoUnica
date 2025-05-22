<template>
  <div>
    <h2>Gestione Organizer</h2>
    <table>
      <thead>
        <tr>
          <th>Nome Azienda</th>
          <th>Email</th>
          <th>Verificato</th>
          <th>Location</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="organizer in organizers" :key="organizer._id">
          <td>{{ organizer.companyName }}</td>
          <td>{{ organizer.email }}</td>
          <td>{{ organizer.verified ? "Sì" : "No" }}</td>
          <td>
            <ul>
              <li v-for="loc in organizer.locations" :key="loc._id">
                {{ loc.name }} - {{ loc.address }} ({{ loc.category }})
              </li>
            </ul>
          </td>
          <td>
            <button v-if="!organizer.verified" @click="verifyOrganizer(organizer._id)">Verifica</button>
            <button v-else @click="disableOrganizer(organizer._id)">Disabilita</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from "@/api/axios";

export default {
  name: "AdminDashboardPage",
  data() {
    return {
      organizers: []
    };
  },
  methods: {
    async fetchOrganizers() {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/users/organizers/all", {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.organizers = res.data;
      } catch (error) {
        console.error("Errore nel caricamento degli organizer:", error);
      }
    },
    async verifyOrganizer(userId) {
      try {
        const token = localStorage.getItem("token");
        await axios.put(`/users/verify/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.fetchOrganizers();
      } catch (error) {
        console.error("Errore nella verifica dell'organizer:", error);
      }
    },
    async disableOrganizer(userId) {
      try {
        const token = localStorage.getItem("token");
        await axios.put(`/users/disable/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.fetchOrganizers();
      } catch (error) {
        console.error("Errore nella disabilitazione dell'organizer:", error);
      }
    }
  },
  mounted() {
    this.fetchOrganizers();
  }
};
</script>

<style scoped>
div {
  padding: 20px;
}
</style>
