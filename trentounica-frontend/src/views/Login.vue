<template>
  <div>
    <h2>Login</h2>
    <form @submit.prevent="login">
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script>
import api from "@/api/axios";

export default {
  name: "UserLogin", // Nome del componente aggiornato
  data() {
    return {
      email: "",
      password: "",
    };
  },
  methods: {
    async login() {
      try {
        const response = await api.post("/users/login", {
          email: this.email,
          password: this.password,
        });
        const { token } = response.data;
        localStorage.setItem("token", token);
        this.$router.push("/dashboard");
      } catch (error) {
        console.error("Errore di login:", error);
      }
    },
  },
};
</script>