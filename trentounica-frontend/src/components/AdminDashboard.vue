<template>
  <div class="page-container">
    <div class="dashboard-box">
      <!-- Bottone indietro -->
      <button class="back-button" @click="$router.back()">← Torna indietro</button>

      <h2>Gestione Organizer</h2>

      <div class="table-wrapper">
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
              <td>
                <span v-if="organizer.verified">
                  Sì ✅ 
                </span>
                <span v-else>
                  No ❌
                </span>
              </td>
              <td>
                <ul>
                  <li v-for="loc in organizer.locations" :key="loc._id">
                    <!--<span v-if="loc.enabled === false" class="disabled-badge"> In attesa approvazione</span>-->
                    <span v-if="loc.enabled === false" class="status-badge red">
                      Non approvata 🚫
                    </span>
                    <span v-else class="status-badge green">
                      Approvata✅
                    </span><br>
                    {{ loc.name }} - {{ loc.address }} ({{ loc.category }})<br />
                    Capienza: {{ loc.maxSeats }}<br />
                    Orari: {{ loc.openingTime }} - {{ loc.closingTime }}
                    <div style="margin-top: 5px;">
                    <button
                      class="action-btn small"
                      :class="loc.enabled ? 'red' : 'green'"
                      @click="toggleLocation(loc._id, !loc.enabled)"
                    >
                      {{ loc.enabled ? 'Disabilita' : 'Attiva' }}
                    </button>
                    </div>
                  </li>
                </ul>
              </td>
              <td>
                <button
                  v-if="!organizer.verified"
                  @click="verifyOrganizer(organizer._id)"
                  class="action-btn green"
                >
                  Verifica
                </button>
                <button
                  v-else
                  @click="disableOrganizer(organizer._id)"
                  class="action-btn red"
                >
                  Disabilita
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "@/api/axios";

export default {
  name: "AdminDashboard",
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
    },
    async toggleLocation(locationId, enabled) {
      try {
        const token = localStorage.getItem("token");
        await axios.patch(`/locations/${locationId}/status`, { enabled }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.fetchOrganizers();
      } catch (error) {
        console.error("Errore nel cambio stato location:", error);
      }
    }
  },
  mounted() {
    this.fetchOrganizers();
  }
};
</script>

<style scoped>
.page-container {
  padding: 60px 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  display: flex;
  justify-content: center;
}

.dashboard-box {
  position: relative;
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  width: 100%;
  max-width: 1100px;
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
  text-align: center;
  color: #2e7d32;
  margin-bottom: 25px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}

thead {
  background-color: #2e7d32;
  color: white;
}

th, td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  vertical-align: top;
}

td ul {
  padding-left: 15px;
  margin: 0;
}

td ul li {
  margin-bottom: 5px;
}

.action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  color: white;
  margin-bottom: 5px;
}

.action-btn.green {
  background-color: #388e3c;
}

.action-btn.green:hover {
  background-color: #2e7d32;
}

.action-btn.red {
  background-color: #c62828;
}

.action-btn.red:hover {
  background-color: #b71c1c;
}

.disabled-badge {
  color: #b71c1c;
  font-size: 14px;
  margin-top: -10px;
}

.action-btn.small {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
}

.status-badge {
  font-size: 14px;
  display: inline-block;
  margin-bottom: 4px;
}

.status-badge.green {
  color: #2e7d32;
}

.status-badge.red {
  color: #c62828;
}

</style>
