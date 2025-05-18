<template>
  <div>
    <h2>Registrati</h2>
    <form @submit.prevent="register">
      <input v-model="name" type="text" placeholder="Nome" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <input v-model="ripetiPassword" type="password" placeholder="Ripeti Password" required />

      <label>
        <input type="radio" value="client" v-model="role" required /> Cliente
      </label>
      <label>
        <input type="radio" value="organizer" v-model="role" required /> Organizzatore
      </label>

      <div v-if="role === 'organizer'">
        <input v-model="companyName" type="text" placeholder="Nome dell'azienda" required />
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
      role: "",
      companyName: "",
      errorMessage: ""
    };
  },
  methods: {
    async register() {
      try {
        if (this.password !== this.ripetiPassword) {
          this.errorMessage = "Le password non coincidono.";
          return;
        }

        const payload = {
          name: this.name,
          email: this.email,
          password: this.password,
          ripetiPassword: this.ripetiPassword,
          role: this.role,
        };

        if (this.role === "organizer") {
          payload.companyName = this.companyName;
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
</style>
