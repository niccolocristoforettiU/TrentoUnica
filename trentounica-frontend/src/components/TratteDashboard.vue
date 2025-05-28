<template>
  <div class="page-container">
    <div class="dashboard-box">
      <h2>{{ title }}</h2>
      <button class="back-button" @click="$router.back()">← Torna indietro</button>
      <div class="filters">
        <div class="filter-row">
          <div class="filter-group">
            <label>
              Data Inizio:
              <input type="date" v-model="startDate" @change="fetchTratte" />
            </label>
            <label>
              Data Fine:
              <input type="date" v-model="endDate" @change="fetchTratte" />
            </label>
            <label>
              Stato:
              <select v-model="selectedStatus" @change="fetchTratte">
                <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
              </select>
            </label>
          </div>
          <div class="filter-actions">
            <button @click="resetFilters">Reset filtri</button>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Data Evento</th>
              <th>Partenza</th>
              <th>Midpoint</th>
              <th>{{ capacita }}</th>
              <th>Utenti Previsti</th>
              <th>Status</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="tratta in tratte" :key="tratta._id">
              <tr>
                <td>{{ new Date(tratta.date).toLocaleString() }}</td>
                <td>{{ new Date(tratta.departureTime).toLocaleString() }}</td>
                <td>{{ tratta.midpoint.lat.toFixed(4) }}, {{ tratta.midpoint.lon.toFixed(4) }}</td>
                <td v-if="['adminApproved', 'finished'].includes(tratta.status)">
                  {{ tratta.bookingCount }} / {{ tratta.capacity }}
                </td>
                <td v-else>
                  {{ tratta.capacity }}
                </td>
                <td>{{ tratta.users.length }}</td>
                <td>{{ tratta.status }}</td>
                <td>
                  <template v-if="this.role === 'trasporti' && tratta.status === 'pending'">
                    <button class="action-btn green" @click="updateStatus(tratta._id, 'transportApproved')">Accetta</button>
                    <button class="action-btn red" @click="updateStatus(tratta._id, 'rejectedByTransport')">Rifiuta</button>
                  </template>
                  <template v-if="this.role === 'trasporti' && tratta.status === 'rejectedByTransport'">
                    <button class="action-btn green" @click="updateStatus(tratta._id, 'pending')">Rivaluta</button>
                  </template>
                  <template v-if="this.role === 'admin' && tratta.status === 'transportApproved'">
                    <button class="action-btn green" @click="updateStatus(tratta._id, 'adminApproved')">Conferma</button>
                    <button class="action-btn red" @click="updateStatus(tratta._id, 'rejectedByAdmin')">Rifiuta</button>
                  </template>
                  <template v-if="this.role === 'admin' && tratta.status === 'rejectedByAdmin'">
                    <button class="action-btn green" @click="updateStatus(tratta._id, 'transportApproved')">Rivaluta</button>
                  </template>
                  <template v-if="this.role === 'trasporti' && tratta.status === 'adminApproved'">
                      <button
                        class="action-btn green"
                        @click="handleFinish(tratta)">
                        Concludi
                      </button>
                  </template>
                  <template v-if="role === 'trasporti' && ['pending', 'transportApproved', 'adminApproved'].includes(tratta.status)">
                    <button class="edit-btn" @click="toggleEdit(tratta._id)">
                      ✏️ Modifica
                    </button>
                  </template>
                </td>
              </tr>
              <tr v-if="editingTrattaId === tratta._id" :key="'edit-' + tratta._id">
                <td colspan="7">
                  <div class="edit-form">
                    <label>
                      Orario di partenza:
                      <input type="datetime-local" v-model="editForm.departureTime" />
                    </label>
                    <label>
                      Capacità:
                      <input type="number" v-model="editForm.capacity" />
                    </label>
                    <label>
                      Midpoint LAT:
                      <input type="number" step="0.0001" v-model="editForm.midpoint.lat" />
                    </label>
                    <label>
                      Midpoint LON:
                      <input type="number" step="0.0001" v-model="editForm.midpoint.lon" />
                    </label>

                    <div style="margin-top: 10px;">
                      <button class="action-btn green" @click="submitEdit(tratta._id)">Salva</button>
                      <button class="action-btn red" @click="editingTrattaId = null">Annulla</button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "@/api/axios";

export default {
  name: "TratteDashboard",
  data() {
    return {
      role: localStorage.getItem("role"),
      tratte: [],
      selectedStatus: localStorage.getItem("role") === "admin" ? "transportApproved" :  "pending",
      startDate: "",
      endDate: "",
      statusOptions: [
        "pending",
        "transportApproved",
        "adminApproved",
        "rejectedByTransport",
        "rejectedByAdmin",
        "finished"
      ],
      editingTrattaId: null,
      editForm: {
        departureTime: "",
        capacity: "",
        midpoint: {
          lat: "",
          lon: ""
        }
      },
      userRole: null
    };
  },
  computed: {
    title() {
      return this.role === "admin" ? "Gestione tratte admin" : "Gestione tratte trasporti";
    },
    capacita() {
      return (this.selectedStatus === "finished" || this.selectedStatus === "adminApproved") ? "Prenotazioni" : "Capacità";
    }
  },
  methods: {
    async fetchTratte() {
      try {
        const token = localStorage.getItem("token");
        const params = {
          startDate: this.startDate,
          endDate: this.endDate
        };
        const res = await axios.get(`/tratte/status/${this.selectedStatus}/filter`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        });
        this.tratte = res.data;
      } catch (err) {
        console.error("Errore nel caricamento tratte:", err);
      }
    },
    async updateStatus(trattaId, newStatus) {
      try {
        const token = localStorage.getItem("token");
        const role = this.role;
        const endpoint = role === 'admin'
          ? `/tratte/${trattaId}/status/admin`
          : `/tratte/${trattaId}/status/transport`;

        await axios.put(endpoint, { newStatus }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        this.fetchTratte();
      } catch (err) {
        console.error("Errore nell'aggiornamento status:", err);
      }
    },
    resetFilters() {
      this.startDate = "";
      this.endDate = "";
      this.role === "admin" ? this.selectedStatus = "transportApproved" : this.selectedStatus = "pending";
      this.fetchTratte();
    },
    canFinish(trattaDate) {
      const now = new Date();
      const date = new Date(trattaDate);
      const diffInMs = now - date;
      return diffInMs >= 24 * 60 * 60 * 1000; // almeno 1 giorno
    },
    handleFinish(tratta) {
      if (!this.canFinish(tratta.date)) {
        alert("Puoi concludere una tratta solo il giorno dopo la tratta stessa");
        return;
      }
      this.updateStatus(tratta._id, 'finished');
    },
    toggleEdit(trattaId) {
      if (this.editingTrattaId === trattaId) {
        this.editingTrattaId = null;
        return;
      }

      const tratta = this.tratte.find(t => t._id === trattaId);
      this.editForm = {
        departureTime: tratta.departureTime.slice(0, 16), // per datetime-local
        capacity: tratta.capacity,
        midpoint: {
          lat: tratta.midpoint.lat,
          lon: tratta.midpoint.lon
        }
      };
      this.editingTrattaId = trattaId;
    },
    async submitEdit(trattaId) {
      try {
        const token = localStorage.getItem("token");
        await axios.put(`/tratte/${trattaId}/transport`, this.editForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.editingTrattaId = null;
        this.fetchTratte();
      } catch (err) {
        console.error("Errore nella modifica tratta:", err);
        alert("Modifica fallita.");
      }
    }
  },
  mounted() {
    this.fetchTratte();
  }
};
</script>

<style scoped>
.edit-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 10px 0;
}
.edit-form label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
}
.edit-form input {
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.edit-btn {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.edit-btn:hover {
  background-color: #1565c0;
}


.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
  background-color: #ffffff;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}
.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
}
.filter-group {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}
.filter-actions button {
  padding: 10px 16px;
  background-color: #2e7d32;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.filter-actions button:hover {
  background-color: #1b5e20;
}
.filters label {
  font-size: 14px;
  color: #333;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 5px;
  height: 58px;
}
.filters input,
.filters select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
}
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
  margin-bottom: 15px;
  background-color: transparent;
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

</style>

