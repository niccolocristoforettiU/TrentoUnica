<template>
  <div class="search-bar-container">
    <input
      type="text"
      v-model="query"
      placeholder="Cerca eventi..."
      @input="handleSearch"
      class="search-input"
    />
    <ul v-if="events.length > 0" class="search-results">
      <li v-for="event in events" :key="event._id">
        <h3>{{ event.title }}</h3>
        <p>{{ event.location }} - {{ formatDate(event.date) }}</p>
        <p>{{ event.description }}</p>
      </li>
    </ul>
    <p v-else-if="query && !loading && !events.length" class="no-results">Nessun risultato trovato.</p>
    <div v-if="loading" class="loading">Caricamento...</div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      query: "",
      events: [],
      loading: false,
    };
  },
  methods: {
    async handleSearch() {
      if (this.query.trim() === "") {
        this.events = [];
        return;
      }

      this.loading = true;
      try {
        const response = await axios.get(`http://localhost:5000/api/search/search?query=${this.query}`);
        this.events = response.data;
      } catch (error) {
        console.error("Errore durante la ricerca:", error);
      } finally {
        this.loading = false;
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString("it-IT", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
  },
};
</script>

<style scoped>
.search-bar-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #ddd;
}

.search-results {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: #f9f9f9;
  border-radius: 0.5rem;
  border: 1px solid #ddd;
  max-height: 300px;
  overflow-y: auto;
}

.search-results li {
  padding: 0.75rem;
  border-bottom: 1px solid #ddd;
}

.search-results li:last-child {
  border-bottom: none;
}

.loading {
  font-size: 0.9rem;
  color: #555;
  text-align: center;
}

.no-results {
  font-size: 0.9rem;
  color: #888;
  text-align: center;
  margin-top: 1rem;
}
</style>
