<template>
  <div>
    <h2>Mappa Location</h2>

    <GMapMap
      :center="defaultCenter"
      :zoom="13"
      style="width: 100%; height: 500px"
    >
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
            <strong>{{ marker.name }}</strong><br />
            {{ marker.address }}
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
      return { lat: 46.0700, lng: 11.1190 }; // Default center
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
          endpoint = "/locations/with-events";
          if (this.startDate) params.startDate = this.startDate;
          if (this.endDate) params.endDate = this.endDate;
          if (this.category) params.category = this.category;
        } else {
          alert("Ruolo utente non autorizzato.");
          return;
        }

        const response = await api.get(endpoint, { params, headers });
        this.locations = response.data;

        // Inizializza infoWindow per ogni marker
        this.infoWindowOpen = this.locations.map(() => false);
        this.infoWindowKey = this.locations.map((_, i) => i);

        console.log("LOCATIONI CARICATE:", this.locations);
      } catch (error) {
        console.error("Errore nel recupero delle location:", error.response || error);
        alert("Errore nel recupero delle location.");
      }
    },
    openOnlyThis(index) {
      // Chiude tutti tranne quello cliccato
      this.infoWindowOpen = this.infoWindowOpen.map((_, i) => i === index);
      // Forza il re-render per riaprire anche se già cliccato
      this.infoWindowKey[index] += 1;
    },
    handleClose(index) {
      this.infoWindowOpen[index] = false;
    }
  }
};
</script>

<style scoped>
.info-window {
  max-width: 200px;
  padding: 8px;
  font-size: 14px;
  line-height: 1.4;
}
</style>
