<template>
  <div class="booking-page">
    <!-- TABS -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'eventi' }" @click="activeTab = 'eventi'">Prenotazioni Eventi</button>
      <button :class="{ active: activeTab === 'tratte' }" @click="activeTab = 'tratte'">Prenotazioni Tratte</button>
      <button :class="{ active: activeTab === 'preferenze' }" @click="activeTab = 'preferenze'; loadPreferences()">Location Preferite</button>
    </div>

    <!-- EVENTI -->
    <div v-if="activeTab === 'eventi'">
      <h2>Le tue prenotazioni</h2>
      <div v-if="bookings.length === 0" class="empty-message">Nessuna prenotazione trovata.</div>
      <div v-for="b in bookings" :key="b._id" class="booking-card">
        <div class="card-header">
          <h3>{{ b.event.title }}</h3>
          <p>{{ new Date(b.event.date).toLocaleString() }}</p>
          <p>{{ b.event.location.name }}</p>
        </div>
        <div class="qr-container">
          <qrcode-vue :value="b._id" :size="100" />
          <button v-if="b.event.price === 0" @click="cancelBooking(b._id)" class="cancel-button">Annulla prenotazione</button>
        </div>
      </div>
    </div>

    <!-- TRATTE -->
    <div v-if="activeTab === 'tratte'">
      <h2>Le tue tratte</h2>
      <div v-if="trattaBookings.length === 0" class="empty-message">Nessuna tratta prenotata.</div>
      <div v-for="tb in trattaBookings" :key="tb._id" class="booking-card">
        <div class="card-header">
          <h3>Evento: <span v-if="tb.tratta?.event?.title">{{ tb.tratta.event.title }}</span><span v-else class="missing-event">Evento non disponibile</span></h3>
          <p><strong>Data:</strong> {{ new Date(tb.tratta.date).toLocaleDateString() }}</p>
          <p><strong>Partenza:</strong> {{ new Date(tb.tratta.departureTime).toLocaleString() }}</p>
          <p><strong>Durata stimata:</strong> {{ tb.tratta.estimatedDuration }} minuti</p>
          <p><strong>Posti:</strong> {{ tb.tratta.bookingCount }}/{{ tb.tratta.capacity }}</p>
        </div>
        <div class="qr-container">
          <qrcode-vue :value="tb._id" :size="100" />
          <button v-if="tb.tratta.status !== 'finished'" @click="cancelTrattaBooking(tb._id)" class="cancel-button">Annulla prenotazione tratta</button>
        </div>
      </div>
    </div>

    <!-- PREFERENZE -->
    <div v-if="activeTab === 'preferenze'">
      <h2>Le tue location preferite</h2>
      <div v-if="preferences.length === 0" class="empty-message">Nessuna location preferita.</div>
      <div v-for="loc in preferences" :key="loc._id" class="booking-card">
        <div class="card-header">
          <h3>{{ loc.name }}</h3>
          <p>{{ loc.address }} - {{ loc.category }}</p>
        </div>
        <div class="qr-container">
          <button @click="removePreference(loc._id)" class="cancel-button">Rimuovi preferenza</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '@/api/axios';
import QrcodeVue from 'qrcode.vue';

export default {
  components: { QrcodeVue },
  data() {
    return {
      bookings: [],
      trattaBookings: [],
      preferences: [],
      activeTab: 'eventi'
    };
  },
  async created() {
    await this.loadBookings();
    await this.loadTrattaBookings();
  },
  methods: {
    async loadBookings() {
      const res = await axios.get('/bookings/client', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      this.bookings = res.data;
    },
    async loadTrattaBookings() {
      const res = await axios.get('/trattabookings/client', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      this.trattaBookings = res.data;
    },
    async loadPreferences() {
      const res = await axios.get('/locations/preferences', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      this.preferences = res.data;
    },
    async cancelBooking(bookingId) {
      if (confirm('Sei sicuro di voler annullare la prenotazione? Verranno annullate anche le tratte collegate.')) {
        const booking = this.bookings.find(b => b._id === bookingId);
        const eventId = booking?.event?._id;

        await axios.delete(`/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (eventId) {
          const linkedTratte = this.trattaBookings.filter(tb => tb.tratta.event._id === eventId);
          for (const tb of linkedTratte) {
            await this.cancelTrattaBooking(tb._id, false);
          }
        }

        await this.loadBookings();
        await this.loadTrattaBookings();
        alert('Prenotazione annullata.');
      }
    },
    async cancelTrattaBooking(id, askConfirm = true) {
      if (!askConfirm || confirm('Vuoi annullare questa tratta?')) {
        await axios.delete(`/trattabookings/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        await this.loadTrattaBookings();
      }
    },
    async removePreference(locationId) {
      try {
        await axios.delete(`/locations/${locationId}/preference`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        this.preferences = this.preferences.filter(p => p._id !== locationId);
        alert('Preferenza rimossa.');
      } catch (err) {
        console.error(err);
        alert('Errore durante la rimozione della preferenza.');
      }
    }
  }
};
</script>


<style scoped>
.booking-page {
  padding: 60px 20px;
  max-width: 800px;
  margin: 0 auto;
  background-color: #f5f7fa;
  min-height: 100vh;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #2e7d32;
}

.empty-message {
  text-align: center;
  color: #888;
  font-size: 1rem;
  margin-top: 20px;
}

.booking-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.card-header h3 {
  margin: 0;
  color: #333;
}

.card-header p {
  margin: 4px 0;
  color: #555;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cancel-button {
  margin-top: 12px;
  background-color: #e53935;
  color: white;
  border: none;
  padding: 10px 20px;
  font-weight: bold;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
}

.cancel-button:hover {
  background-color: #c62828;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.tabs button {
  padding: 10px 20px;
  background-color: #eeeeee;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.tabs button.active {
  background-color: #2e7d32;
  color: white;
}
</style>
