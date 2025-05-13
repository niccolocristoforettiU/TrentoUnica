<template>
  <div>
    <h2>Registrati</h2>
    <form @submit.prevent="register">
      <input v-model="name" type="text" placeholder="Nome" />
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button type="submit">Registrati</button>
    </form>
  </div>
</template>

<script>
import api from "@/api/axios";

export default {
  name: "UserRegister", // Nome del componente aggiornato
  data() {
    return {
      name: "",
      email: "",
      password: "",
    };
  },
  methods: {
    async register() {
      try {
        await api.post("/users/register", {
          name: this.name,
          email: this.email,
          password: this.password,
        });
        this.$router.push("/login");
      } catch (error) {
        console.error("Errore di registrazione:", error);
      }
    },
  },
};
</script>