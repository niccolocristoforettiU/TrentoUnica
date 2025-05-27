

<template>
  <div class="organizer-locations">
    <h1>Le mie Location</h1>

    <div v-if="loading">Caricamento location...</div>
    <div v-else-if="locations.length === 0">Nessuna location trovata.</div>

    <ul v-else>
      <li v-for="loc in locations" :key="loc._id" class="location-item">
        <h3>{{ loc.name }}</h3>
        <p><strong>Indirizzo:</strong> {{ loc.address }}</p>
        <p><strong>Categoria:</strong> {{ loc.category }}</p>
        <p><strong>Orari:</strong> {{ loc.openingTime }} - {{ loc.closingTime }}</p>
        <p><strong>Capienza massima:</strong> {{ loc.maxSeats }}</p>
        <p><strong>Latitudine/Longitudine:</strong> {{ loc.lat }}, {{ loc.lon }}</p>
        <p><strong>Stato:</strong> 
          <span :style="{ color: loc.enabled ? 'green' : 'red' }">
            {{ loc.enabled ? ' Attiva' : ' Disabilitata' }}
          </span>
        </p>
        <p v-if="loc.approved !== undefined"><strong>Approvazione:</strong>
          <span :style="{ color: loc.approved ? 'green' : 'orange' }">
            {{ loc.approved ? ' Approvata' : ' In attesa' }}
          </span>
        </p>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from "@/api/axios";

export default {
  name: 'OrganizerLocation',
  data() {
    return {
      locations: [],
      loading: false
    };
  },
  methods: {
    async fetchLocations() {
      this.loading = true;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/locations/organizer", {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.locations = res.data;
      } catch (error) {
        console.error("Errore nel recupero delle location:", error);
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    this.fetchLocations();
  }
};
</script>

<style scoped>
.organizer-locations {
  max-width: 800px;
  margin: 0 auto;
}

.location-item {
  border: 1px solid #ccc;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 5px;
}
</style>