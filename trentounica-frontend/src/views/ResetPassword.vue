<template>
  <div class="reset-password-page">
    <h2>Reimposta la password</h2>

    <!-- MESSAGGIO DI SUCCESSO -->
    <p v-if="message" style="color: green">
      {{ message }} <br />
      <router-link to="/login">Torna al login</router-link>
    </p>

    <!-- MESSAGGIO DI ERRORE -->
    <p v-if="error" style="color: red">{{ error }}</p>

    <!-- FORM (solo se non è andato a buon fine) -->
    <form v-if="!message" @submit.prevent="resetPassword">
      <div>
        <label for="newPassword">Nuova password:</label>
        <input type="password" v-model="newPassword" required />
      </div>
      <div>
        <label for="confirmPassword">Conferma password:</label>
        <input type="password" v-model="confirmPassword" required />
      </div>
      <button type="submit">Conferma</button>
    </form>
  </div>
</template>


<script>
import axios from 'axios';

export default {
  data() {
    return {
      newPassword: '',
      confirmPassword: '',
      message: '',
      error: ''
    };
  },
  methods: {
    async resetPassword() {
      this.message = '';
      this.error = '';
      try {
        const token = this.$route.params.token;
        const response = await axios.post(`http://localhost:5050/api/users/reset-password/${token}`, {
          newPassword: this.newPassword,
          confirmPassword: this.confirmPassword
        });
        this.message = response.data.message;
      } catch (err) {
        this.error = err.response?.data?.message || 'Errore imprevisto';
      }
    }
  }
};
</script>
