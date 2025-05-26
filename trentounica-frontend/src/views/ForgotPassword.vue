<template>
  <div class="forgot-password-page">
    <h2>Recupera password</h2>
    <form @submit.prevent="submitEmail">
      <label for="email">Inserisci la tua email:</label>
      <input v-model="email" type="email" required />
      <button type="submit">Invia link di reset</button>
    </form>
    <p v-if="message" style="color: green">{{ message }}</p>
    <p v-if="error" style="color: red">{{ error }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      email: '',
      message: '',
      error: ''
    };
  },
  methods: {
    async submitEmail() {
      this.message = '';
      this.error = '';
      try {
        const res = await axios.post('http://localhost:5050/api/users/forgot-password', {
          email: this.email
        });
        this.message = res.data.message;
      } catch (err) {
        this.error = err.response?.data?.message || 'Errore imprevisto';
      }
    }
  }
};
</script>
