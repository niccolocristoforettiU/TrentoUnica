

<template>
  <div v-if="event">
    <h1>{{ event.title }}</h1>
    <p><strong>Luogo:</strong> {{ event.location.name }} - {{ event.location.address }}</p>
    <p><strong>Data:</strong> {{ new Date(event.date).toLocaleString() }}</p>
    <p><strong>Durata:</strong> {{ event.duration }} ore</p>
    <p><strong>Descrizione:</strong> {{ event.description }}</p>
    <p><strong>Organizzatore:</strong> {{ event.organizer.companyName }} ({{ event.organizer.email }})</p>
    <p><strong>Prezzo:</strong> €{{ event.price }}</p>
    <p><strong>Popolarità:</strong> {{ event.popularity }}</p>
  </div>
  <div v-else>
    <p>Caricamento evento in corso...</p>
  </div>
</template>

<script>
import axios from "@/api/axios";

export default {
  name: 'EventDetail',
  data() {
    return {
      event: null
    };
  },
  async created() {
    try {
      const id = this.$route.params.id;
      const response = await axios.get(`/events/${id}`);
      this.event = response.data;
    } catch (error) {
      console.error('Errore durante il recupero dei dettagli dell\'evento:', error);
    }
  }
};
</script>

<style scoped>
h1 {
  margin-bottom: 1rem;
}

p {
  margin: 0.5rem 0;
}
</style>