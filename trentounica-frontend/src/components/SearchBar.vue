<template>
  <div class="search-container">
    <h1>TrentoUnica</h1>
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

    <label class="filter-label">
      <input 
        type="checkbox" 
        v-model="sortByDate" 
        @change="fetchEvents" 
      />
      Ordina per data (dal più recente)
    </label>

    <label class="filter-label">
      <input 
        type="checkbox" 
        v-model="sortByPopularity" 
        @change="fetchEvents" 
      />
      Ordina per popolarità
    </label>

    <ul class="event-list">
      <li v-for="event in events" :key="event._id" class="event-item">
        <strong>{{ event.title }}</strong> - {{ new Date(event.date).toLocaleDateString("it-IT") }} - {{ event.category }}
      </li>
    </ul>
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
      events: []
    };
  },
  created() {
    this.fetchEvents(); // Carica tutti gli eventi all'avvio
  },
  methods: {
    async fetchEvents() {
      try {
        const token = localStorage.getItem("token"); // Prendi il token dal localStorage
        const response = await axios.get("http://localhost:5050/api/search", {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            query: this.searchQuery,
            category: this.selectedCategory,
            sortByDate: this.sortByDate,
            sortByPopularity: this.sortByPopularity
          }
        });
        this.events = response.data;
      } catch (error) {
        console.error("Errore durante il caricamento degli eventi:", error);
      }
    }
  }
};
</script>

<style scoped>
.search-container {
  width: 80%;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.search-input {
  width: 100%;
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 16px;
}

.filter-select {
  width: 100%;
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 16px;
}

.filter-label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
}

.event-list {
  list-style-type: none;
  padding: 0;
}

.event-item {
  background-color: #ffffff;
  margin-bottom: 15px;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
}

.event-item strong {
  font-size: 18px;
  color: #333;
}

.event-item .event-date {
  font-size: 14px;
  color: #777;
}

.event-item .event-category {
  font-size: 14px;
  color: #555;
}
</style>
