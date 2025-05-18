<template>
  <div>
    <h2>Login</h2>
    <form @submit.prevent="login">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script>
import axios from "@/api/axios";

export default {
  name: "UserLogin",
  data() {
    return {
      email: "",
      password: "",
      errorMessage: ""
    };
  },
  methods: {
    async login() {
      try {
        const response = await axios.post("/users/login", {
          email: this.email,
          password: this.password,
        });

        const { token, role, message } = response.data;

        // Controlla se l'organizzatore è in attesa di verifica
        if (role === "organizer" && message === "Il tuo account è in attesa di verifica. Contatta l'amministratore.") {
          this.errorMessage = message;
          return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem("role", role);

        if (role === "client") {
          this.$router.push("/client/dashboard");
        } else if (role === "organizer") {
          this.$router.push("/organizer/dashboard");
        } else if (role === "admin") {
          this.$router.push("/admin/dashboard");
        }
      } catch (error) {
        this.errorMessage = error.response?.data?.message || "Errore durante il login";
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
