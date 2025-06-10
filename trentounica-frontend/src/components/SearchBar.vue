<template>
  <div class="search-page">
    <div class="search-box">
      <h1>🎟️ TrentoUnica – Cerca eventi</h1>

      <input
        type="text"
        placeholder="Cerca eventi..."
        v-model="searchQuery"
        @input="fetchEvents"
        class="search-input"
      />

      <select v-model="selectedCategory" @change="fetchEvents" class="filter-select">
        <option value="">Tutte le categorie</option>
        <option value="bar">Bar</option>
        <option value="discoteca">Discoteca</option>
        <option value="concerto">Concerto</option>
      </select>

      <div class="checkbox-group">
        <label><input type="checkbox" v-model="sortByDate" @change="fetchEvents" /> Ordina per data (decrescente)</label>
        <label><input type="checkbox" v-model="sortByPopularity" @change="fetchEvents" /> Ordina per popolarità</label>
      </div>

      <div class="checkbox-group" v-if="role === 'organizer'">
        <label>
          <input type="checkbox" v-model="showOnlyMine" @change="fetchEvents" />
          Solo i miei eventi
        </label>
      </div>

      <div class="checkbox-group" v-if="role === 'client'">
        <label>
          <input type="checkbox" v-model="showOnlyPreferred" @change="fetchEvents" />
          Solo eventi preferiti
        </label>
        <label>
          <input type="checkbox" v-model="showOnlyPreferredLocations" @change="fetchEvents" />
          Solo eventi in location preferite
        </label>
      </div>
      
      <button class="reset-button" @click="resetFilters">Reset filtri</button>

      <ul class="event-list">
        <li
          v-for="event in events"
          :key="event._id"
          class="event-card"
          @click="goToEvent(event._id)"
        >
          <div class="event-title">{{ event.title }}</div>
          <div class="event-meta">
            📅 {{ new Date(event.date).toLocaleDateString("it-IT") }} • 🏷️ {{ event.category }}
          </div>
          <div class="event-location">📍 {{ event.location?.name }}</div>
        </li>
      </ul>

      <p v-if="events.length === 0" class="no-results">Nessun evento trovato.</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      searchQuery: "",
      selectedCategory: "",
      sortByDate: false,
      sortByPopularity: false,
      onlyUpcoming: true,
      events: [],
      showOnlyMine: false,
      showOnlyPreferred: false,
      showOnlyPreferredLocations: false,
      role: localStorage.getItem("role") || ""
    };
  },
  created() {
    this.fetchEvents();
  },
  methods: {
    async fetchEvents() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/search`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            query: this.searchQuery,
            category: this.selectedCategory,
            sortByDate: this.sortByDate,
            sortByPopularity: this.sortByPopularity,
            onlyUpcoming: true,
            onlyMine: this.role === "organizer" && this.showOnlyMine,
            onlyPreferred: this.role === "client" && this.showOnlyPreferredLocations,
            onlyEventPreferred: this.role === "client" && this.showOnlyPreferred
          }
        });
        this.events = response.data;
      } catch (error) {
        console.error("Errore durante il caricamento degli eventi:", error);
      }
    },
    goToEvent(eventId) {
      this.$router.push(`/event/${eventId}`);
    },
    resetFilters() {
      this.searchQuery = "";
      this.selectedCategory = "";
      this.sortByDate = false;
      this.sortByPopularity = false;
      this.showOnlyMine = false;
      this.showOnlyPreferred = false;
      this.showOnlyPreferredLocations = false;
      this.fetchEvents();
    }
  }
};
</script>

<style scoped>
.search-page {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding: 60px 20px;
  display: flex;
  justify-content: center;
}

.search-box {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #2e7d32;
  margin-bottom: 25px;
}

.search-input,
.filter-select {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  margin-bottom: 15px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0 auto 20px auto;
  font-size: 14px;
  align-items: center;
  text-align: left;
  width: fit-content;
}

.reset-button {
  margin-bottom: 20px;
  padding: 8px 16px;
  background-color: #2e7d32;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  align-self: center;
}

.reset-button:hover {
  background-color: #27642a;
}

.event-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.event-card {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.event-card:hover {
  transform: scale(1.01);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.event-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.event-meta {
  font-size: 14px;
  color: #555;
  margin-bottom: 4px;
}

.event-location {
  font-size: 14px;
  color: #666;
}

.no-results {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-top: 20px;
}
</style>
