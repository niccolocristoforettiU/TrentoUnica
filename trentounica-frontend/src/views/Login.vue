<template>
  <div class="login-container">
    <div class="login-box">
      <!-- Bottone indietro -->
      <button class="back-button" @click="$router.back()">← Torna indietro</button>

      <h2>Accedi a TrentoUnica</h2>

      <form @submit.prevent="login">
        <input v-model="email" type="email" placeholder="Email" required />
        <input v-model="password" type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
      <div class="forgot-password">
        <router-link to="/forgot-password">Recupera Password</router-link>
      </div>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
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

        if (role === "organizer" && message === "Il tuo account è in attesa di verifica. Contatta l'amministratore.") {
          this.errorMessage = message;
          return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("name", response.data.name);

        this.$router.push("/");
      } catch (error) {
        this.errorMessage = error.response?.data?.message || "Errore durante il login";
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 90vh;
  background-color: #f5f7fa;
}

.login-box {
  position: relative;
  background-color: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

/* Bottone indietro */
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
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
}

input:focus {
  border-color: #2e7d32;
  outline: none;
}

button[type="submit"] {
  padding: 12px;
  background-color: #2e7d32;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

button[type="submit"]:hover {
  background-color: #1b5e20;
}

.error-message {
  margin-top: 15px;
  color: red;
  font-size: 14px;
}
</style>
