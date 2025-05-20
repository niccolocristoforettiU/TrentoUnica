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
        <select v-model="event.locationId" required @change="onLocationChange">
          <option v-for="location in locations" :key="location._id" :value="location._id">
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
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        this.locations = response.data;
        console.log("Location caricate:", this.locations);

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
        console.log("Location selezionata:", selectedLocation);
        console.log("Categoria associata:", this.event.category);
      }
    },
    async createEvent() {
      console.log("Dati evento prima dell'invio:", this.event);
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
          headers: {
            Authorization: `Bearer ${token}`
          }
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
        category:'',
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