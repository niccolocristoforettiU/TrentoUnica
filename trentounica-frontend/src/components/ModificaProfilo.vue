<template>
  <div class="register-container">
    <div class="register-box">
      <button class="back-button" @click="$router.back()">← Torna indietro</button>
      <h2>Modifica Profilo</h2>

      <form @submit.prevent="updateProfile">
        <input v-model="form.email" type="email" placeholder="Email" />

        <input v-if="isAdminOrTransport" v-model="form.name" type="text" placeholder="Nome" />

        <div v-if="role === 'client'" class="client-section">
          <input v-model="form.name" type="text" placeholder="Nome completo" />
          <AddressSearch @address-selected="updateClientAddress" />
          <label>Data di nascita:
            <input v-model="form.birthDate" type="date" />
          </label>
        </div>

        <div v-if="role === 'organizer'" class="organizer-section">
          <input v-model="form.companyName" type="text" placeholder="Nome azienda" />
          <input v-model="form.partitaIva" type="text" placeholder="Partita IVA" />
        </div>

        <input v-model="form.newPassword" type="password" placeholder="Nuova password" />
        <input v-model="form.confirmPassword" type="password" placeholder="Conferma nuova password" />

        <button type="submit" class="submit-btn">Salva modifiche</button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "@/api/axios";
import AddressSearch from "@/components/AddressSearch.vue";

export default {
  name: "ModificaProfilo",
  components: { AddressSearch },
  data() {
    return {
      role: localStorage.getItem("role"),
      form: {
        email: "",
        name: "",
        address: "",
        birthDate: "",
        lat: null,
        lon: null,
        companyName: "",
        partitaIva: "",
        newPassword: "",
        confirmPassword: ""
      }
    };
  },
  computed: {
    isAdminOrTransport() {
      return this.role === "admin" || this.role === "trasporti";
    }
  },
  mounted() {
    axios
      .get("/users/profile")
      .then(({ data }) => {
        this.form.email = data.email || "";
        this.form.name = data.name || "";
        this.form.address = data.address || "";
        this.form.birthDate = data.birthDate ? new Date(data.birthDate).toISOString().split("T")[0] : "";
        this.form.companyName = data.companyName || "";
        this.form.partitaIva = data.partitaIva || "";
        this.form.lat = data.lat;
        this.form.lon = data.lon;
      })
      .catch(() => {
        this.$router.push({ name: "ErrorPage", query: { message: "Errore nel caricamento del profilo." } });
      });
  },
  methods: {
    updateClientAddress({ address, lat, lng }) {
      this.form.address = address;
      this.form.lat = lat;
      this.form.lon = lng;
    },
    async updateProfile() {
      const payload = { ...this.form };

      for (const key in payload) {
        if (payload[key] === "" || payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      }

      try {
        await axios.put("/users/profile", payload);
        alert("Profilo aggiornato con successo!");
        this.$router.push("/");
      } catch (err) {
        console.error(err);
        alert("Errore durante l'aggiornamento del profilo.");
      }
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
input:focus, select:focus {
  border-color: #2e7d32;
  outline: none;
}
.client-section, .organizer-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
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
.submit-btn:hover {
  background-color: #1b5e20;
}
</style>
