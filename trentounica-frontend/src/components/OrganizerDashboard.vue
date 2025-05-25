<template>
  <div class="dashboard-wrapper">
    <!-- Bottone indietro -->
    <button class="back-button" @click="$router.back()">← Torna indietro</button>

    <div class="dashboard">
      <h2>Dashboard Organizzatore</h2>
      <p>Benvenuto nel dashboard dell'organizzatore!</p>

      <h3>I Tuoi Eventi</h3>

      <label>
        <input type="checkbox" v-model="showUpcomingOnly" />
        Mostra solo eventi futuri
      </label>

      <div v-if="loading" class="loading-text">Caricamento eventi...</div>

      <div v-else-if="filteredEvents.length > 0" class="event-list">
        <div v-for="event in filteredEvents" :key="event._id" class="event-card">
          <h3 class="event-title">{{ event.title }}</h3>

          <div class="event-details">
            <p><strong>Data:</strong> {{ new Date(event.date).toLocaleString() }}</p>
            <p><strong>Location:</strong> {{ event.location.name }}</p>
            <p><strong>Descrizione:</strong> {{ event.description }}</p>
            <p><strong>Prezzo:</strong> €{{ event.price }}</p>
            <p><strong>Categoria:</strong> {{ event.category }}</p>
            <p><strong>Popolarità:</strong> {{ event.popularity }}</p>
            <p v-if="event.bookingRequired"><strong>N. prenotati:</strong> {{ event.bookingCount }}</p>
          </div>

          <div class="button-group">
            <button class="edit-btn" @click="editEvent(event)">Modifica</button>
            <button class="delete-btn" @click="deleteEvent(event._id)">Elimina</button>
            <router-link
              v-if="event.bookingRequired"
              :to="`/organizer/event/${event._id}/scan`"
              class="scan-btn"
            >
              Scanner QR
            </router-link>
          </div>
        </div>
      </div>

      <div v-else class="no-events">Nessun evento trovato.</div>
    </div>
  </div>
</template>


<script>
import axios from "@/api/axios";

export default {
  name: "OrganizerDashboard",
  data() {
    return {
      events: [],
      loading: false,
      showUpcomingOnly: false,
    };
  },
  created() {
    this.fetchEvents();
  },
  computed: {
    filteredEvents() {
      if (!this.showUpcomingOnly) return this.events;
      const now = new Date();
      return this.events.filter(event => new Date(event.date) > now);
    }
  },
  methods: {
    async fetchEvents() {
      this.loading = true;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/events/organizer/bookings-count", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.events = response.data;
      } catch (error) {
        console.error("Errore nel caricamento degli eventi:", error);
      } finally {
        this.loading = false;
      }
    },
    async editEvent(event) {
      this.$router.push(`/organizer/edit-event/${event._id}`);
    },
    async deleteEvent(eventId) {
      if (confirm("Sei sicuro di voler eliminare questo evento?")) {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/events/${eventId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          this.events = this.events.filter(event => event._id !== eventId);
        } catch (error) {
          console.error("Errore durante l'eliminazione dell'evento:", error);
        }
      }
    }
  }
};
</script>

<style scoped>
.scan-btn {
  background-color: #2e7d32;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
  line-height: 1.5;
}

.scan-btn:hover {
  background-color: #1b5e20;
}
.event-title {
  text-align: center;
  margin-bottom: 15px;
  color: #2e7d32;
  font-size: 20px;
  font-weight: 600;
}

.event-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
  color: #444;
}
.dashboard-wrapper {
  background-color: #f5f7fa;
  padding: 60px 20px;
  min-height: 100vh;
}

.dashboard {
  max-width: 900px;
  margin: 0 auto;
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

h2 {
  text-align: center;
  color: #2e7d32;
  margin-bottom: 5px;
}

p {
  text-align: center;
  color: #333;
}

h3 {
  margin-top: 30px;
  margin-bottom: 20px;
  text-align: center;
  color: #333;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.event-card {
  background-color: #fcfcfc;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.event-card h3 {
  margin-bottom: 10px;
  font-size: 1.2em;
  color: #2e7d32;
}

.event-card p {
  margin: 4px 0;
  font-size: 14px;
  color: #555;
  text-align: left;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
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

.delete-btn {
  background-color: #e53935;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.delete-btn:hover {
  background-color: #c62828;
}

</style>
