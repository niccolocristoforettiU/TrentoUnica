<template>
  <div>
    <h2>{{ title }}</h2>

    <div v-if="showFilters" class="filters mb-4">
      <label for="startDate">Data Inizio:</label>
      <input type="date" v-model="startDate" @change="fetchLocations" />
      <label for="endDate">Data Fine:</label>
      <input type="date" v-model="endDate" @change="fetchLocations" />
      <label for="category">Categoria:</label>
      <select v-model="category" @change="fetchLocations">
        <option value="">Tutte</option>
        <option value="bar">Bar</option>
        <option value="discoteca">Discoteca</option>
        <option value="concerto">Concerto</option>
      </select>
      <button @click="resetFilters">Reset filtri</button>
    </div>

    <GMapMap :center="defaultCenter" :zoom="13" style="width: 100%; height: 500px">
      <GMapMarker
        v-for="(marker, index) in locations"
        :key="index"
        :position="{ lat: marker.lat, lng: marker.lon }"
        @click="openOnlyThis(index)"
      >
        <GMapInfoWindow
          :opened="infoWindowOpen[index]"
          :key="infoWindowKey[index]"
          @closeclick="handleClose(index)"
          :options="{ disableAutoPan: true }"
        >
          <div class="info-window" @click.stop>
            <template v-if="role === 'organizer'">
              <strong>{{ marker.name }}</strong><br />
              {{ marker.address }}
            </template>
            <template v-else>
              <div v-for="(event, idx) in marker.events" :key="idx" style="margin-bottom: 8px;">
                <strong>{{ event.title }}</strong><br />
                {{ event.date }}<br />
                Prezzo: €{{ event.price }}<br />
                {{ event.description }}
                <hr v-if="idx < marker.events.length - 1" />
              </div>
              <small><em>{{ marker.name }} - {{ marker.address }}</em></small>
            </template>
          </div>
        </GMapInfoWindow>
      </GMapMarker>
    </GMapMap>
  </div>
</template>

<script>
import api from "@/api/axios";

export default {
  name: "LocationMap",
  data() {
    return {
      locations: [],
      infoWindowOpen: [],
      infoWindowKey: [],
      role: localStorage.getItem("role") || "",
      startDate: "",
      endDate: "",
      category: ""
    };
  },
  computed: {
    defaultCenter() {
      if (this.locations.length) {
        return {
          lat: this.locations[0].lat,
          lng: this.locations[0].lon
        };
      }
      return { lat: 46.0700, lng: 11.1190 }; // Trento
    },
    title() {
      return this.role === "organizer" ? "Mappa Location" : "Mappa Eventi";
    },
    showFilters() {
      return this.role === "client" || this.role === "admin";
    }
  },
  mounted() {
    this.fetchLocations();
  },
  methods: {
    async fetchLocations() {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        let endpoint = "";
        let params = {};

        if (this.role === "organizer") {
          endpoint = "/locations/organizer";
        } else if (this.role === "client" || this.role === "admin") {
          endpoint = "/events/filter";
          if (this.startDate) params.startDate = this.startDate;
          if (this.endDate) params.endDate = this.endDate;
          if (this.category) params.category = this.category;
        } else {
          alert("Ruolo utente non autorizzato.");
          return;
        }

        const response = await api.get(endpoint, { params, headers });

        if (this.role === "organizer") {
          this.locations = response.data.map(loc => ({
            lat: loc.lat,
            lon: loc.lon,
            name: loc.name,
            address: loc.address
          }));
        } else {
          const grouped = {};
          response.data
            .filter(e => e.location)
            .forEach(e => {
              const locId = e.location._id;
              if (!grouped[locId]) {
                grouped[locId] = {
                  lat: e.location.lat,
                  lon: e.location.lon,
                  name: e.location.name,
                  address: e.location.address,
                  events: []
                };
              }
              grouped[locId].events.push({
                title: e.title,
                description: e.description,
                date: new Date(e.date).toLocaleString(),
                price: e.price
              });
            });

          this.locations = Object.values(grouped);
        }

        this.infoWindowOpen = this.locations.map(() => false);
        this.infoWindowKey = this.locations.map((_, i) => i);
        console.log("MARKERS:", this.locations);
      } catch (error) {
        console.error("Errore nel recupero delle location:", error.response || error);
        alert("Errore nel recupero delle location.");
      }
    },
    resetFilters() {
      this.startDate = "";
      this.endDate = "";
      this.category = "";
      this.fetchLocations();
    },
    openOnlyThis(index) {
      this.infoWindowOpen = this.infoWindowOpen.map((_, i) => i === index);
      this.infoWindowKey[index] += 1;
    },
    handleClose(index) {
      this.infoWindowOpen[index] = false;
    }
  }
};
</script>

<style scoped>
.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}
.filters label {
  margin-right: 5px;
}
.info-window {
  max-width: 250px;
  padding: 8px;
  font-size: 14px;
  line-height: 1.4;
}
</style>
