<template>
  <div class="event-form">
    <button class="back-button" @click="$router.back()">← Torna indietro</button>
    <h2 class="form-title">Crea un Nuovo Evento</h2>

    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <form @submit.prevent="createEvent" class="event-fields">
      <div>
        <label for="title">Titolo</label>
        <input type="text" v-model="event.title" required minlength="5" placeholder="Inserisci il titolo dell'evento" />
      </div>

      <div>
        <label for="description">Descrizione</label>
        <textarea v-model="event.description" placeholder="Descrizione dell'evento"></textarea>
      </div>

      <div>
        <label for="date">Data</label>
        <input type="datetime-local" v-model="event.date" :min="minDate" required />
      </div>

      <div>
        <label for="locationId">Location</label>
        <select v-model="event.locationId" required @change="onLocationChange">
          <option value="" disabled>Seleziona una location</option>
          <option v-for="location in locations" :key="location._id" :value="location._id">
            {{ location.name }} - {{ location.category }}
          </option>
        </select>
      </div>

      <div>
        <label for="price">Prezzo (€)</label>
        <input type="number" v-model="event.price" min="0" placeholder="Inserisci il prezzo (opzionale)" />
      </div>

      <div>
        <label for="duration">Durata (minuti)</label>
        <input type="number" v-model="event.duration" min="1" required placeholder="Durata dell'evento in minuti" />
      </div>

      <div>
        <label>
          <input type="checkbox" v-model="event.bookingRequired" />
          Evento a prenotazione
        </label>
      </div>

      <button type="submit">Crea Evento</button>
    </form>
  </div>
</template>

<script>
import axios from "@/api/axios";

export default {
  data() {
    return {
      event: {
        title: '',
        description: '',
        date: '',
        locationId: '',
        category: '',
        price: 0,
        duration: '',
        bookingRequired: false,
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
        const token = localStorage.getItem('token');
        if (!token) {
          this.errorMessage = "Autenticazione non valida. Effettua il login.";
          return;
        }

        const response = await axios.get('/locations/organizer', {
          headers: { Authorization: `Bearer ${token}` }
        });

        this.locations = response.data;

        if (this.locations.length === 0) {
          this.errorMessage = "Non ci sono location associate a questo organizer.";
        } else {
          this.errorMessage = "";
        }
      } catch (error) {
        console.error("Errore nel caricamento delle location:", error);
        this.errorMessage = error.response?.data?.message || "Errore nel caricamento delle location.";
      } finally {
        this.loading = false;
      }
    },
    onLocationChange() {
      const selectedLocation = this.locations.find(loc => loc._id === this.event.locationId);
      if (selectedLocation) {
        this.event.category = selectedLocation.category;
      }
    },
    async createEvent() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.errorMessage = "Autenticazione non valida. Effettua il login.";
          return;
        }

        if (!this.event.locationId) {
          this.errorMessage = "Seleziona una location valida.";
          return;
        }

        await axios.post('/events', this.event, {
          headers: { Authorization: `Bearer ${token}` }
        });

        this.successMessage = "Evento creato con successo!";
        this.errorMessage = '';
        this.resetForm();
      } catch (error) {
        console.error("Errore durante la creazione dell'evento:", error);
        this.successMessage = '';

        if (error.response) {
          if (error.response.status === 400) {
            this.errorMessage = "Richiesta non valida. Verifica i campi e riprova.";
          } else if (error.response.status === 401) {
            this.errorMessage = "Sessione scaduta. Effettua di nuovo il login.";
            localStorage.removeItem('token');
            this.$router.push('/login');
          } else if (error.response.status === 403) {
            this.errorMessage = "Non hai i permessi per creare questo evento.";
          } else {
            this.errorMessage = error.response.data?.message || "Errore nella creazione dell'evento.";
          }
        } else {
          this.errorMessage = "Errore nella creazione dell'evento.";
        }
      }
    },
    resetForm() {
      this.event = {
        title: '',
        description: '',
        date: '',
        locationId: '',
        category: '',
        price: 0,
        duration: '',
        bookingRequired: false
      };
    }
  }
};
</script>

<style scoped>
.back-button {
  margin-bottom: 10px;
  background: transparent;
  border: none;
  color: #2e7d32;
  font-size: 14px;
  cursor: pointer;
}
.back-button:hover {
  text-decoration: underline;
}

.event-form {
  max-width: 650px;
  margin: 60px auto;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.form-title {
  text-align: center;
  font-size: 24px;
  color: #2e7d32;
  margin-bottom: 25px;
}

.event-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

form label {
  font-weight: 600;
  margin-bottom: 5px;
  display: block;
}

input,
textarea,
select {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

button {
  background-color: #2e7d32;
  color: white;
  font-weight: 600;
  border: none;
  padding: 12px;
  font-size: 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #1b5e20;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
}
</style>
