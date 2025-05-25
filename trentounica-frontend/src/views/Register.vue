<template>
  <div class="register-container">
    <div class="register-box">
      <!-- Bottone indietro -->
      <button class="back-button" @click="$router.back()">← Torna indietro</button>

      <h2>Registrazione</h2>

      <form @submit.prevent="register">
        <input v-model="email" type="email" placeholder="Email" required />
        <input v-model="password" type="password" placeholder="Password" required />
        <input v-model="ripetiPassword" type="password" placeholder="Ripeti Password" required />

        <div class="radio-group">
          <label>
            <input type="radio" value="client" v-model="role" required /> Cliente
          </label>
          <label>
            <input type="radio" value="organizer" v-model="role" required /> Organizzatore
          </label>
        </div>

        <div v-if="role === 'client'" class="client-section">
          <input v-model="name" type="text" placeholder="Nome completo" required />
          <AddressSearch @address-selected="updateClientAddress" required />
          <label>
            Data di nascita:
            <input v-model="birthDate" type="date" required />
          </label>
        </div>

        <div v-if="role === 'organizer'" class="organizer-section">
          <input v-model="companyName" type="text" placeholder="Nome dell'azienda" required />
          <input v-model="partitaIva" type="text" placeholder="Partita IVA" required />

          <h3>Locations</h3>
          <div v-for="(loc, index) in locations" :key="index" class="location-entry">
            <input v-model="loc.name" type="text" placeholder="Nome Location" required />
            <AddressSearch @address-selected="(data) => updateLocationAddress(index, data)" />
            <input v-model="loc.openingTime" type="time" required />
            <input v-model="loc.closingTime" type="time" required />
            <input v-model="loc.maxSeats" type="number" placeholder="Posti Massimi" required />
            <select v-model="loc.category" required>
              <option value="" disabled>Seleziona Categoria</option>
              <option value="bar">Bar</option>
              <option value="discoteca">Discoteca</option>
              <option value="concerto">Concerto</option>
            </select>
            <button type="button" @click="removeLocation(index)">Rimuovi</button>
          </div>
          <button type="button" @click="addLocation" class="add-location-btn">Aggiungi Location</button>
        </div>

        <button type="submit" class="submit-btn">Registrati</button>
      </form>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import axios from "@/api/axios";
import AddressSearch from '@/components/AddressSearch.vue';

export default {
  name: "UserRegister",
  components: { AddressSearch },
  data() {
    return {
      name: "",
      email: "",
      password: "",
      ripetiPassword: "",
      role: "client",
      companyName: "",
      address: "",
      birthDate: "",
      partitaIva: "",
      clientLat: null,
      clientLon: null,
      locations: [{
        name: "", address: "", openingTime: "", closingTime: "",
        maxSeats: "", category: "", lat: null, lon: null
      }],
      errorMessage: ""
    };
  },
  methods: {
    addLocation() {
      this.locations.push({
        name: "", address: "", openingTime: "", closingTime: "",
        maxSeats: "", category: "", lat: null, lon: null
      });
    },
    removeLocation(index) {
      this.locations.splice(index, 1);
    },
    updateClientAddress({ address, lat, lng }) {
      this.address = address;
      this.clientLat = lat;
      this.clientLon = lng;
    },
    updateLocationAddress(index, { address, lat, lng }) {
      this.locations[index].address = address;
      this.locations[index].lat = lat;
      this.locations[index].lon = lng;
    },
    async register() {
      this.errorMessage = "";
      if (this.password !== this.ripetiPassword) {
        this.errorMessage = "Le password non coincidono.";
        return;
      }

      const payload = {
        email: this.email,
        password: this.password,
        ripetiPassword: this.ripetiPassword,
        role: this.role,
      };

      if (this.role === "client") {
        if (!this.address || this.clientLat == null || this.clientLon == null) {
          this.errorMessage = "Inserisci un indirizzo valido con coordinate.";
          return;
        }
        payload.name = this.name;
        payload.address = this.address;
        payload.lat = this.clientLat;
        payload.lon = this.clientLon;

      } else if (this.role === "organizer") {
        payload.companyName = this.companyName;
        payload.partitaIva = this.partitaIva;

        const invalidLocation = this.locations.find(loc =>
          !loc.name.trim() || !loc.address.trim() ||
          loc.lat == null || loc.lon == null ||
          !loc.openingTime || !loc.closingTime ||
          !loc.maxSeats || !loc.category
        );
        if (invalidLocation) {
          this.errorMessage = "Tutte le location devono avere indirizzo e coordinate validi.";
          return;
        }
        payload.locations = this.locations;
      }

      try {
        const response = await axios.post("/users/register", payload);
        alert(response.data.message);
        this.$router.push("/login");
      } catch (error) {
        this.errorMessage = error.response?.data?.message || "Errore durante la registrazione";
      }
    }
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.register-box {
  position: relative;
  background-color: white;
  padding: 40px;
  border-radius: 10px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
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

input[type="text"],
input[type="email"],
input[type="password"],
input[type="number"],
input[type="date"],
input[type="time"],
select,
label > input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

input:focus, select:focus {
  border-color: #2e7d32;
  outline: none;
}

.radio-group {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.client-section, .organizer-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
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

.add-location-btn,
.submit-btn {
  padding: 12px;
  background-color: #2e7d32;
  color: white;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-location-btn:hover,
.submit-btn:hover {
  background-color: #1b5e20;
}

.error-message {
  margin-top: 10px;
  color: red;
  font-size: 14px;
  text-align: center;
}
address-search {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

address-search:focus {
  border-color: #2e7d32;
  outline: none;
}
</style>
