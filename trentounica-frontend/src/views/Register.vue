<template>
  <div>
    <h2>Registrazione</h2>
    <form @submit.prevent="register">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <input v-model="ripetiPassword" type="password" placeholder="Ripeti Password" required />

      <label>
        <input type="radio" value="client" v-model="role" required /> Cliente
      </label>
      <label>
        <input type="radio" value="organizer" v-model="role" required /> Organizzatore
      </label>

      <div v-if="role === 'client'">
        <input v-model="name" type="text" placeholder="Nome completo" required />
        <input v-model="address" type="text" placeholder="Indirizzo" required />
        <input v-model="age" type="number" placeholder="Età" required />
      </div>

      <div v-if="role === 'organizer'">
        <input v-model="companyName" type="text" placeholder="Nome dell'azienda" required />
        <input v-model="partitaIva" type="text" placeholder="Partita IVA" required />

        <h3>Locations</h3>
        <div v-for="(loc, index) in locations" :key="index" class="location-entry">
          <input v-model="loc.name" type="text" placeholder="Nome Location" required />
          <input v-model="loc.address" type="text" placeholder="Indirizzo Location" required />
          <input v-model="loc.openingTime" type="time" placeholder="Orario di Apertura" required />
          <input v-model="loc.closingTime" type="time" placeholder="Orario di Chiusura" required />
          <input v-model="loc.maxSeats" type="number" placeholder="Posti Massimi" required />

          <select v-model="loc.category" required>
            <option value="" disabled>Seleziona Categoria</option>
            <option value="bar">Bar</option>
            <option value="discoteca">Discoteca</option>
            <option value="concerto">Concerto</option>
          </select>

          <button type="button" @click="removeLocation(index)">Rimuovi Location</button>
        </div>
        <button type="button" @click="addLocation">Aggiungi Location</button>
      </div>

      <button type="submit">Registrati</button>
    </form>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script>
import axios from "@/api/axios";

export default {
  name: "UserRegister",
  data() {
    return {
      name: "",
      email: "",
      password: "",
      ripetiPassword: "",
      role: "client",
      companyName: "",
      address: "",
      age: "",
      partitaIva: "",
      locations: [
        { name: "", address: "", openingTime: "", closingTime: "", maxSeats: "", category: "" }
      ],
      errorMessage: ""
    };
  },
  methods: {
    addLocation() {
      this.locations.push({ name: "", address: "", openingTime: "", closingTime: "", maxSeats: "", category: "" });
    },
    removeLocation(index) {
      this.locations.splice(index, 1);
    },
    async register() {
      try {
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
          payload.name = this.name;
          payload.address = this.address;
          payload.age = this.age;
        } else if (this.role === "organizer") {
          payload.companyName = this.companyName;
          payload.partitaIva = this.partitaIva;
          payload.locations = this.locations.filter(
            loc => loc.name.trim() && loc.address.trim() && loc.openingTime && loc.closingTime && loc.maxSeats && loc.category
          );
        }

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
.error {
  color: red;
  margin-top: 10px;
}

.location-entry {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

button {
  margin-top: 10px;
}
</style>