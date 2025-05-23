<template>
  <div class="booking-page">
    <h2>Le tue prenotazioni</h2>

    <div v-if="bookings.length === 0" class="empty-message">
      Nessuna prenotazione trovata.
    </div>

    <div
      v-for="b in bookings"
      :key="b._id"
      class="booking-card"
    >
      <div class="card-header">
        <h3>{{ b.event.title }}</h3>
        <p>{{ new Date(b.event.date).toLocaleString() }}</p>
        <p>{{ b.event.location.name }}</p>
      </div>

      <div class="qr-container">
        <qrcode-vue :value="b._id" :size="100" />

        <button
          v-if="b.event.price === 0"
          @click="cancelBooking(b._id)"
          class="cancel-button"
        >
          Annulla prenotazione
        </button>
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
      bookings: []
    };
  },
  async created() {
    await this.loadBookings();
  },
  methods: {
    async loadBookings() {
      const res = await axios.get('/bookings/client', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      this.bookings = res.data;
    },
    async cancelBooking(bookingId) {
      if (confirm('Sei sicuro di voler annullare la prenotazione?')) {
        try {
          await axios.delete(`/bookings/${bookingId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          await this.loadBookings();
          alert('Prenotazione annullata con successo.');
        } catch (error) {
          console.error('Errore durante l\'annullamento:', error);
          alert('Errore durante l\'annullamento della prenotazione.');
        }
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
</style>
