<template>
  <div v-if="event">
    <h1>{{ event.title }}</h1>
    <p><strong>Luogo:</strong> {{ event.location.name }} - {{ event.location.address }}</p>
    <p><strong>Data:</strong> {{ new Date(event.date).toLocaleString() }}</p>
    <p><strong>Durata:</strong> {{ event.duration }} ore</p>
    <p><strong>Descrizione:</strong> {{ event.description }}</p>
    <p><strong>Organizzatore:</strong> {{ event.organizer.companyName }} ({{ event.organizer.email }})</p>
    <p><strong>Prezzo:</strong> €{{ event.price }}</p>
    <p><strong>Popolarità:</strong> {{ event.popularity }}</p>

    <!-- Se è richiesto booking e l’utente è client -->
    <div v-if="event.bookingRequired && userRole === 'client'">
      <p v-if="event.bookingCount >= event.location.maxSeats" class="text-danger">
        Evento sold out 🚫
      </p>

      <button v-else-if="!hasBooking" @click="prenotaEvento" class="btn btn-primary">
        Prenotazione
      </button>

      <p v-else class="text-success">
        Prenotazione già effettuata ✔️
      </p>
    </div>

    <!-- Mostra il biglietto se disponibile -->
    <div v-if="ticket" class="ticket-popup">
      <h3>Biglietto per {{ ticket.title }}</h3>
      <p>{{ new Date(ticket.date).toLocaleString() }}</p>
      <p>{{ ticket.location.name }} - {{ ticket.location.address }}</p>
      <qrcode-vue :value="ticket.qrCodeData" :size="150" />
    </div>
  </div>
  <div v-else>
    <p>Caricamento evento in corso...</p>
  </div>
</template>

<script>
import axios from "@/api/axios";
import QrcodeVue from 'qrcode.vue';

export default {
  name: 'EventDetail',
  components: { QrcodeVue },
  data() {
    return {
      event: null,
      ticket: null,
      hasBooking: false,
      userRole: localStorage.getItem("role"),
      token: localStorage.getItem("token")
    };
  },
  async created() {
    try {
      const id = this.$route.params.id;
      const response = await axios.get(`/events/${id}`);
      this.event = response.data;

      // Controlla se l'utente è loggato e client, poi verifica se ha prenotato
      if (this.token && this.userRole === 'client') {
        await this.checkBooking();
      }
    } catch (error) {
      console.error('Errore durante il recupero dei dettagli dell\'evento:', error);
    }
  },
  methods: {
    async prenotaEvento() {
      try {
        // 1. Crea la prenotazione
        await axios.post('/bookings', {
          eventId: this.event._id
        }, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        });

        // 2. Recupera il biglietto
        const response = await axios.get(`/bookings/ticket/${this.event._id}`, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        });

        this.ticket = response.data.ticket;
        this.hasBooking = true;

      } catch (err) {
        console.error(err);
        alert("Prenotazione non disponibile o già effettuata.");
      }
    },

    async checkBooking() {
      try {
        const res = await axios.get(`/bookings/ticket/${this.event._id}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        this.hasBooking = true;
        this.ticket = res.data.ticket;
      } catch (err) {
        if (err.response?.status === 403) {
          this.hasBooking = false; // Utente non ha ancora prenotato
        } else {
          console.error("Errore nel checkBooking:", err);
        }
      }
    }
  }
};
</script>

<style scoped>
h1 {
  margin-bottom: 1rem;
}
p {
  margin: 0.5rem 0;
}
</style>
