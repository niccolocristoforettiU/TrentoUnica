<template>
  <div>
    <h2>Dashboard Organizzatore</h2>
    <p>Benvenuto nel dashboard dell'organizzatore!</p>
    
    <h3>I Tuoi Eventi</h3>
    <div v-if="loading">Caricamento eventi...</div>
    <ul v-else-if="events.length > 0">
      <li v-for="event in events" :key="event._id">
        <h3>{{ event.title }}</h3>
        <p><strong>Data:</strong> {{ new Date(event.date).toLocaleString() }}</p>
        <p><strong>Location:</strong> {{ event.location.name }}</p>
        <p><strong>Descrizione:</strong> {{ event.description }}</p>
        <p><strong>Prezzo:</strong> {{ event.price }} €</p>
        <p><strong>Categoria:</strong> {{ event.category }}</p>
        <p><strong>Popolarità:</strong> {{ event.popularity }}</p>
        <p>N. prenotati: {{ event.bookingCount }}</p>
        <button @click="editEvent(event)">Modifica</button>
        <button @click="deleteEvent(event._id)">Elimina</button>
      </li>
    </ul>
    <div v-else>
      Nessun evento trovato.
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
    };
  },
  created() {
    this.fetchEvents();
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
h2 {
  color: #8e44ad;
}
</style>
