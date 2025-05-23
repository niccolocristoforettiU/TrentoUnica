<template>
  <div class="map-page-container">
    <h2>{{ title }}</h2>
    <button class="back-button" @click="$router.back()">← Torna indietro</button>

    <div v-if="showFilters" class="filters">
      <label>
        Data Inizio:
        <input type="date" v-model="startDate" @change="fetchLocations" />
      </label>

      <label>
        Data Fine:
        <input type="date" v-model="endDate" @change="fetchLocations" />
      </label>

      <label>
        Categoria:
        <select v-model="category" @change="fetchLocations">
          <option value="">Tutte</option>
          <option value="bar">Bar</option>
          <option value="discoteca">Discoteca</option>
          <option value="concerto">Concerto</option>
        </select>
      </label>

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
.map-page-container {
  padding: 40px 20px;
  background-color: #f5f7fa;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
  background-color: #ffffff;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.filters label {
  font-size: 14px;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filters input,
.filters select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
}

.filters button {
  padding: 10px 16px;
  background-color: #2e7d32;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.filters button:hover {
  background-color: #1b5e20;
}

.info-window {
  max-width: 260px;
  font-size: 13px;
  line-height: 1.5;
  color: #333;
}

.info-window strong {
  font-size: 14px;
  color: #2e7d32;
}

.info-window hr {
  margin: 6px 0;
  border: none;
  border-top: 1px solid #ddd;
}

.info-window small {
  color: #777;
}
.back-button {
  margin-bottom: 15px;
  background-color: transparent;
  border: none;
  color: #2e7d32;
  font-size: 14px;
  cursor: pointer;
}

.back-button:hover {
  text-decoration: underline;
}

</style>
