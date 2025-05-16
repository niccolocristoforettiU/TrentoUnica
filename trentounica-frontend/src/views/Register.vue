<template>
  <div>
    <h2>Registrati</h2>
    <form @submit.prevent="register">
      <input v-model="name" type="text" placeholder="Nome" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <input v-model="ripetiPassword" type="password" placeholder="Ripeti Password" required />
      <button type="submit">Registrati</button>
    </form>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script>
import api from "@/api/axios";

export default {
  name: "UserRegister",
  data() {
    return {
      name: "",
      email: "",
      password: "",
      ripetiPassword: "",  // <--- Assicurati che ci sia anche questo
      errorMessage: ""
    };
  },
  methods: {
    async register() {
      try {
        // Controlla che le password coincidano
        if (this.password !== this.ripetiPassword) {
          this.errorMessage = "Le password non coincidono.";
          return;
        }

        // Invia i dati al server
        await api.post("/users/register", {
          name: this.name,
          email: this.email,
          password: this.password,
          ripetiPassword: this.ripetiPassword
        });

        // Reindirizza alla pagina di login
        this.$router.push("/login");
      } catch (error) {
        console.error("Errore di registrazione:", error);
        this.errorMessage = error.response?.data?.message || "Errore durante la registrazione";
      }
    }
  }
};
</script>
