<template>
  <div class="map-page-container">
    <h2>{{ title }}</h2>
    <button class="back-button" @click="$router.back()">← Torna indietro</button>

    <div v-if="showFilters" class="filters">
      <div class="filter-row">
        <div class="filter-group">
          <label>
            Data Inizio:
            <input type="date" v-model="startDate" @change="handleFilterChange" />
          </label>
          <label>
            Data Fine:
            <input type="date" v-model="endDate" @change="handleFilterChange" />
          </label>
          <label>
            Categoria:
            <select v-model="category" @change="handleFilterChange">
              <option value="">Tutte</option>
              <option value="bar">Bar</option>
              <option value="discoteca">Discoteca</option>
              <option value="concerto">Concerto</option>
            </select>
          </label>
          <template v-if="role === 'organizer'">
            <label class="filters-checkbox-stacked">
              Solo i miei eventi
              <input type="checkbox" v-model="showOnlyMine" @change="handleFilterChange" />
            </label>
          </template>
          <template v-if="role === 'client'">
            <label class="filters-checkbox-stacked">
              Solo eventi in location preferite
              <input type="checkbox" v-model="showOnlyPreferredLocations" @change="handleFilterChange" />
            </label>
            <label class="filters-checkbox-stacked">
              Solo eventi preferiti
              <input type="checkbox" v-model="showOnlyPreferredEvents" @change="handleFilterChange" />
            </label>
          </template>
        </div>
        <div class="filter-actions">
          <button @click="resetFilters">Reset filtri</button>
        </div>
      </div>
    </div>

    <div id="map" style="width: 100%; height: 500px;"></div>
  </div>
</template>

<script>
/* global google */
import { Loader } from "@googlemaps/js-api-loader";
import api from "@/api/axios";

const loader = new Loader({
  apiKey: process.env.VUE_APP_GOOGLE_MAPS_API_KEY,
  version: "weekly",
});

export default {
  name: "LocationMap",
  data() {
    return {
      role: localStorage.getItem("role") || "",
      startDate: "",
      endDate: "",
      category: "",
      showOnlyMine: false,
      showOnlyPreferredLocations: false,
      showOnlyPreferredEvents: false,
      locations: [],
      AdvancedMarkerElement: null,
    };
  },
  computed: {
    title() {
      return this.role === "organizer" ? "Mappa Location" : "Mappa Eventi";
    },
    showFilters() {
      return ["client", "admin", "organizer"].includes(this.role);
    },
    defaultCenter() {
      if (this.locations.length) {
        return {
          lat: this.locations[0].lat,
          lng: this.locations[0].lon,
        };
      }
      return { lat: 46.06768, lng: 11.12426 }; // Trento
    },
  },
  async mounted() {
    try {
      await loader.load();
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      this.AdvancedMarkerElement = AdvancedMarkerElement;

      await this.fetchLocations();

      const map = new Map(document.getElementById("map"), {
        center: this.defaultCenter,
        zoom: 13,
        mapId: process.env.VUE_APP_GOOGLE_MAPS_ID,
      });

      this.renderMarkers(map);
    } catch (error) {
      console.error("Errore inizializzazione Google Maps:", error);
    }
  },
  methods: {
    async fetchLocations() {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const todayStr = new Date().toISOString().split("T")[0];

        const params = {
          startDate: this.startDate || todayStr,
          endDate: this.endDate || undefined,
          category: this.category || undefined,
        };

        if (this.role === "organizer") {
          params.onlyMine = this.showOnlyMine;
        } else if (this.role === "client") {
          params.onlyPreferred = this.showOnlyPreferredLocations;
          params.onlyEventPreferred = this.showOnlyPreferredEvents;
        }

        const response = await api.get("/events/filter", { params, headers });

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
                events: [],
              };
            }
            grouped[locId].events.push({
              id: e._id,
              title: e.title,
              description: e.description,
              date: new Date(e.date).toLocaleString(),
              price: e.price,
            });
          });

        this.locations = Object.values(grouped);
      } catch (err) {
        console.error("Errore nel recupero delle location:", err);
      }
    },

    renderMarkers(map) {
      if (!this.AdvancedMarkerElement) return;

      this.locations.forEach(loc => {
        const marker = new this.AdvancedMarkerElement({
          map,
          position: { lat: loc.lat, lng: loc.lon },
          title: loc.name,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: this.buildInfoContent(loc),
        });

        marker.addListener("gmp-click", () => {
          infoWindow.open(map, marker);
        });
      });
    },

    buildInfoContent(marker) {
      const container = document.createElement("div");
      container.className = "info-window";

      marker.events.forEach((event, idx) => {
        const div = document.createElement("div");
        div.innerHTML = `<strong>${event.title}</strong><br/>${event.date}<br/>Prezzo: €${event.price}<br/>${event.description}`;
        div.style.cursor = "pointer";
        div.style.marginBottom = "8px";
        div.onclick = () => this.goToEventDetail(event.id);
        container.appendChild(div);
        if (idx < marker.events.length - 1) {
          container.appendChild(document.createElement("hr"));
        }
      });

      const footer = document.createElement("small");
      footer.innerHTML = `<em>${marker.name} - ${marker.address}</em>`;
      container.appendChild(footer);

      return container;
    },

    handleFilterChange() {
      this.fetchLocations().then(() => {
        const map = new google.maps.Map(document.getElementById("map"), {
          center: this.defaultCenter,
          zoom: 13,
          mapId: process.env.VUE_APP_GOOGLE_MAPS_ID,
        });
        this.renderMarkers(map);
      });
    },

    resetFilters() {
      this.startDate = "";
      this.endDate = "";
      this.category = "";
      this.showOnlyMine = false;
      this.showOnlyPreferredLocations = false;
      this.showOnlyPreferredEvents = false;
      this.handleFilterChange();
    },

    goToEventDetail(id) {
      this.$router.push({ name: "EventDetail", params: { id } });
    },
  },
};
</script>

<style scoped>
/* your full CSS was preserved as-is */
.map-page-container {
  padding-top: 20px;
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
