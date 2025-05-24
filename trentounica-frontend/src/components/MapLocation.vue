<template>
  <div class="map-page-container">
    <h2>{{ title }}</h2>
    <button class="back-button" @click="$router.back()">← Torna indietro</button>

    <div v-if="showFilters" class="filters">
      <div class="filter-row">
        <div class="filter-group">
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

          <template v-if="role === 'organizer'">
            <label class="filters-checkbox-stacked">
              Solo i miei eventi
              <input type="checkbox" v-model="showOnlyMine" @change="fetchLocations" />
            </label>
          </template>
          <template v-if="role === 'client'">
            <label class="filters-checkbox-stacked">
              Solo i miei eventi preferiti
              <input type="checkbox" v-model="showOnlyPreferred" @change="fetchLocations" />
            </label>
          </template>
        </div>

        <div class="filter-actions">
          <button @click="resetFilters">Reset filtri</button>
        </div>
      </div>
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
            <div
              v-for="(event, idx) in marker.events"
              :key="idx"
              style="margin-bottom: 8px; cursor: pointer;"
              @click="() => goToEventDetail(event.id)"
            >
              <strong>{{ event.title }}</strong><br />
              {{ event.date }}<br />
              Prezzo: €{{ event.price }}<br />
              {{ event.description }}
              <hr v-if="idx < marker.events.length - 1" />
            </div>
            <small><em>{{ marker.name }} - {{ marker.address }}</em></small>
            <div style="margin-top: 6px;">
              <a
                :href="`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(marker.address)}`"
                target="_blank"
                rel="noopener noreferrer"
                style="color: #1a73e8; text-decoration: underline; font-size: 13px;"
              >
                Ottieni indicazioni
              </a>
            </div>
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
      category: "",
      showOnlyMine: false,
      showOnlyPreferred: false,
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
      return this.role === "client" || this.role === "admin" || this.role === "organizer";
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
          endpoint = "/events/filter";
          params.onlyMine = this.showOnlyMine;

          if (this.startDate) params.startDate = this.startDate;
          if (this.endDate) params.endDate = this.endDate;
          if (this.category) params.category = this.category;
        } else if (this.role === "client" || this.role === "admin") {
          endpoint = "/events/filter";
          if (this.startDate) params.startDate = this.startDate;
          if (this.endDate) params.endDate = this.endDate;
          if (this.category) params.category = this.category;
          if (this.role === "client") {
            params.onlyPreferred = this.showOnlyPreferred;
          }
        } else {
          alert("Ruolo utente non autorizzato.");
          return;
        }

        const response = await api.get(endpoint, { params, headers });

        if (this.role === "organizer") {
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
                id: e._id,
                title: e.title,
                description: e.description,
                date: new Date(e.date).toLocaleString(),
                price: e.price
              });
            });

          this.locations = Object.values(grouped).filter(loc => loc.events.length > 0);
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
                id: e._id,
                title: e.title,
                description: e.description,
                date: new Date(e.date).toLocaleString(),
                price: e.price
              });
            });

          this.locations = Object.values(grouped).filter(loc => loc.events.length > 0);
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
      this.showOnlyMine = false;
      this.showOnlyPreferred = false;
      this.fetchLocations();
    },
    openOnlyThis(index) {
      this.infoWindowOpen = this.infoWindowOpen.map((_, i) => i === index);
      this.infoWindowKey[index] += 1;
    },
    handleClose(index) {
      this.infoWindowOpen[index] = false;
    },
    goToEventDetail(eventId) {
      this.$router.push({ name: 'EventDetail', params: { id: eventId } });
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

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
}

.filter-group {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.checkbox-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.filter-actions {
  display: flex;
  align-items: center;
}

.filters label {
  font-size: 14px;
  color: #333;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 5px;
  height: 58px;
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
.filters-checkbox-stacked {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  font-size: 14px;
  color: #333;
  height: 58px;
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
