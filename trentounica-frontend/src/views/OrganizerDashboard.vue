<template>
  <div>
    <h1>Dashboard Organizer</h1>
    <EventForm />
    <div v-if="loading">Caricamento eventi...</div>
    <ul v-else-if="events.length > 0">
      <li v-for="event in events" :key="event._id">
        <h3>{{ event.title }}</h3>
        <p><strong>Data:</strong> {{ new Date(event.date).toLocaleString() }}</p>
        <p><strong>Location:</strong> {{ event.location }}</p>
        <p><strong>Descrizione:</strong> {{ event.description }}</p>
        <p><strong>Prezzo:</strong> {{ event.price }} €</p>
        <p><strong>Durata:</strong> {{ event.duration }} minuti</p>
        <p><strong>Categoria:</strong> {{ event.category }}</p>
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
import EventForm from "@/components/EventForm.vue";
import axios from "axios";

export default {
  components: {
    EventForm
  },
  data() {
    return {
      events: [],
      loading: false
    };
  },
  methods: {
    async fetchEvents() {
      this.loading = true;
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const response = await axios.get("/events", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        // Filtriamo solo gli eventi creati dall'organizer autenticato
        this.events = response.data.filter(event => event.organizer && event.organizer._id === userId);
      } catch (error) {
        console.error("Errore nel caricamento degli eventi:", error);
      } finally {
        this.loading = false;
      }
    },
    async editEvent(event) {
      // Redirige l'utente a una pagina di modifica dell'evento
      this.$router.push(`/organizer/edit-event/${event._id}`);
    },
    async deleteEvent(eventId) {
      if (confirm("Sei sicuro di voler eliminare questo evento?")) {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`http://localhost:3000/api/events/${eventId}`, {
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
  },
  mounted() {
    this.fetchEvents();
  }
};
</script>