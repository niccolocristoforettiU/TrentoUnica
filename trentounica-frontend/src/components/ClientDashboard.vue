<template>
  <div v-for="b in bookings" :key="b._id" class="booking-card">
    <h3>{{ b.event.title }}</h3>
    <p>{{ new Date(b.event.date).toLocaleString() }}</p>
    <p>{{ b.event.location.name }}</p>

    <div class="center-content">
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
.booking-card {
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 1rem;
}

.cancel-button {
  margin-top: 0.5rem;
  background-color: #e53935;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  font-weight: bold;
  font-size: 1rem;
  border-radius: 10px;
  cursor: pointer;
}
.cancel-button:hover {
  background-color: #c62828;
}
</style>
