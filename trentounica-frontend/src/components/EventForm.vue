<template>
  <div class="event-form">
    <h2>Crea un Nuovo Evento</h2>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <form @submit.prevent="createEvent">
      <div>
        <label for="title">Titolo</label>
        <input type="text" v-model="event.title" required minlength="5" placeholder="Inserisci il titolo dell'evento" />
      </div>

      <div>
        <label for="description">Descrizione</label>
        <textarea v-model="event.description"></textarea>
      </div>

      <div>
        <label for="date">Data</label>
        <input type="datetime-local" v-model="event.date" :min="minDate" required />
      </div>

      <div>
        <label for="locationId">Location</label>
        <select v-model="event.locationId" required>
          <option v-for="location in locations" :key="location.locationId" :value="location.locationId">
            {{ location.name }} - {{ location.category }}
          </option>
        </select>
      </div>

      <div>
        <label for="price">Prezzo (€)</label>
        <input type="number" v-model="event.price" min="0" placeholder="Inserisci il prezzo (opzionale)" />
      </div>

      <button type="submit">Crea Evento</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      event: {
        title: '',
        description: '',
        date: '',
        locationId: '',
        price: 0,
      },
      locations: [],
      loading: false,
      successMessage: '',
      errorMessage: '',
      minDate: new Date().toISOString().slice(0, 16)
    };
  },
  created() {
    this.fetchLocations();
  },
  methods: {
    async fetchLocations() {
      this.loading = true;
      try {
        const response = await axios.get('http://localhost:3000/api/locations');
        this.locations = response.data;
      } catch (error) {
        console.error("Errore nel caricamento delle location:", error);
      } finally {
        this.loading = false;
      }
    },
    async createEvent() {
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:3000/api/events',
          this.event,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        this.successMessage = "Evento creato con successo!";
        this.errorMessage = '';
        this.resetForm();
      } catch (error) {
        console.error("Errore durante la creazione dell'evento:", error);
        this.successMessage = '';
        this.errorMessage = "Errore nella creazione dell'evento.";
      }
    },
    resetForm() {
      this.event = {
        title: '',
        description: '',
        date: '',
        locationId: '',
        price: 0,
      };
    }
  }
};
</script>

<style scoped>
.event-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 10px;
}

form div {
  margin-bottom: 15px;
}

form label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, textarea, select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background-color: #0056b3;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
}
</style>