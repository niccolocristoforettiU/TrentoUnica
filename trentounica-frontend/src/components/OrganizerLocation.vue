<template>
  <div class="register-container">
    <div class="register-box">
      <button class="back-button" @click="$router.back()">← Torna indietro</button>
      <h2>Gestione Location</h2>

      <form @submit.prevent="saveLocations">
        <h3>Location Esistenti</h3>
        <p v-if="existingLocations.length === 0" style="color: #888;">
          Nessuna location trovata. Aggiungine una per iniziare.
        </p>
        <div v-for="(loc, index) in existingLocations" :key="loc._id" class="location-entry">
          <input v-model="loc.name" type="text" placeholder="Nome Location" required />
          <AddressSearch @address-selected="(data) => updateLocationAddress(existingLocations, index, data)" />
          <input v-model="loc.openingTime" type="time" required />
          <input v-model="loc.closingTime" type="time" required />
          <input v-model="loc.maxSeats" type="number" placeholder="Posti Massimi" required />
          <select v-model="loc.category" required>
            <option disabled value="">Categoria</option>
            <option value="bar">Bar</option>
            <option value="discoteca">Discoteca</option>
            <option value="concerto">Concerto</option>
          </select>
          <button type="button" class="remove-btn" @click="removeLocation(index, false)">Elimina location</button>
        </div>

        <h3>Nuove Location</h3>
        <div v-for="(loc, index) in newLocations" :key="'new-' + index" class="location-entry">
          <input v-model="loc.name" type="text" placeholder="Nome Location" required />
          <AddressSearch @address-selected="(data) => updateLocationAddress(newLocations, index, data)" />
          <input v-model="loc.openingTime" type="time" required />
          <input v-model="loc.closingTime" type="time" required />
          <input v-model="loc.maxSeats" type="number" placeholder="Posti Massimi" required />
          <select v-model="loc.category" required>
            <option disabled value="">Categoria</option>
            <option value="bar">Bar</option>
            <option value="discoteca">Discoteca</option>
            <option value="concerto">Concerto</option>
          </select>
          <button type="button" class="remove-btn" @click="removeLocation(index, true)">Rimuovi</button>
        </div>

        <button type="button" @click="addLocation" class="add-location-btn">Aggiungi Location</button>
        <button type="submit" class="submit-btn">Salva modifiche</button>
      </form>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import axios from '@/api/axios';
import AddressSearch from '@/components/AddressSearch.vue';

export default {
  name: 'OrganizerLocationsEditor',
  components: { AddressSearch },
  data() {
    return {
      existingLocations: [],
      newLocations: [],
      errorMessage: ''
    };
  },
  async mounted() {
    try {
      const res = await axios.get('/locations/organizer');
      this.existingLocations = res.data || [];
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Nessuna location trovata: non è un errore grave
        this.existingLocations = [];
      } else {
        console.error('Errore nel caricamento delle location:', err);
      }
    }
  },
  methods: {
    addLocation() {
      this.newLocations.push({
        name: '', address: '', openingTime: '', closingTime: '',
        maxSeats: '', category: '', lat: null, lon: null
      });
    },
    async removeLocation(index, isNew) {
      if (isNew) {
        this.newLocations.splice(index, 1);
      } else {
        const confirmed = confirm(
          '❗ Eliminando questa location verranno rimossi anche:\n- Eventi\n- Tratte\n- Prenotazioni\n- Preferenze\n\nSei sicuro di voler continuare?'
        );

        if (!confirmed) return;

        const location = this.existingLocations[index];
        try {
          await axios.delete(`/locations/${location._id}`);
          this.existingLocations.splice(index, 1);
          alert('✅ Location eliminata con successo');
        } catch (err) {
          console.error('Errore eliminazione:', err);
          this.errorMessage = 'Errore durante l\'eliminazione della location';
        }
      }
    },
    updateLocationAddress(list, index, { address, lat, lng }) {
      list[index].address = address;
      list[index].lat = lat;
      list[index].lon = lng;
    },
    async saveLocations() {
      this.errorMessage = '';

      const validate = (loc) =>
        loc.name?.trim() &&
        loc.address?.trim() &&
        loc.openingTime &&
        loc.closingTime &&
        loc.maxSeats &&
        loc.category &&
        loc.lat !== null &&
        loc.lon !== null;

      for (const loc of this.newLocations) {
        if (!validate(loc)) continue;
        try {
          await axios.post('/locations', loc);
        } catch (err) {
          console.error('Errore creazione location:', err);
        }
      }

      for (const loc of this.existingLocations) {
        if (!validate(loc)) continue;
        try {
          await axios.put(`/locations/${loc._id}`, loc);
        } catch (err) {
          console.error('Errore aggiornamento location:', err);
        }
      }

      alert('Location salvate con successo!');
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 60px 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}
.register-box {
  background-color: white;
  padding: 40px;
  border-radius: 10px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
}
.back-button {
  position: absolute;
  top: 15px;
  left: 15px;
  background: transparent;
  border: none;
  color: #2e7d32;
  font-size: 14px;
  cursor: pointer;
}
.back-button:hover {
  text-decoration: underline;
}
h2 {
  margin-bottom: 20px;
  color: #2e7d32;
  text-align: center;
}
form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
input, select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
.location-entry {
  background-color: #f1f1f1;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.add-location-btn, .submit-btn {
  padding: 12px;
  background-color: #2e7d32;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.add-location-btn:hover, .submit-btn:hover {
  background-color: #1b5e20;
}
.remove-btn {
  background-color: #e53935;
  color: white;
  border: none;
  padding: 12px;
  font-size: 13px;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  align-self: center;
  transition: background-color 0.2s ease;
  width: fit-content;
}

.remove-btn:hover {
  background-color: #c62828;
}

.error-message {
  color: red;
  text-align: center;
  margin-top: 10px;
}
</style>
