<template>
  <div class="tratte-map-layout">
    <!-- Sidebar con i filtri e le cards -->

    <div class="filters-sidebar">
    <button class="back-button" @click="$router.back()">← Torna indietro</button>
      <h3>Filtri Tratte</h3>
      <div class="filters">
        <label>
          Data Inizio:
          <input type="date" v-model="startDate" @change="fetchTratte" />
        </label>
        <label>
          Data Fine:
          <input type="date" v-model="endDate" @change="fetchTratte" />
        </label>
        <label>
          Stato:
          <select v-model="status" @change="fetchTratte">
            <option v-for="option in statusOptions" :key="option" :value="option" >
              {{ option }}
            </option>
          </select>
        </label>
        <button class="reset-button" @click="resetFilters">Reset filtri</button>
      </div>

      <div class="tratte-cards">
        <div v-if="tratte.length === 0" class="no-results">
          Nessuna tratta trovata per i filtri selezionati.
        </div>
        <div
          v-for="tratta in tratte"
          :key="tratta._id"
          class="tratta-card"
          :class="{ focused: tratta._id === focusedTrattaId }"
          @click="focusTratta(tratta)"
        >
          <strong>{{ tratta.event?.title || 'Evento Sconosciuto' }}</strong><br />
          Partenza: {{
            new Date(tratta.departureTime).toLocaleString("it-IT", {
              weekday: 'long',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }}<br/>
          Fermata:
          <template v-if="tratta.mapsAddress">
            {{ tratta.mapsAddress }}
          </template>
          <template v-else>
            {{ tratta.midpoint.lat.toFixed(4) }}, {{ tratta.midpoint.lon.toFixed(4) }}
          </template>
        </div>

      </div>
    </div>

    <!-- Mappa -->
    <div class="map-container">
      <div id="map" style="width: 100%; height: 100%;"></div>
    </div>
  </div>
</template>

<script>
import { Loader } from "@googlemaps/js-api-loader";
import api from "@/api/axios";

const loader = new Loader({
  apiKey: process.env.VUE_APP_GOOGLE_MAPS_API_KEY,
  version: "weekly",
  libraries: ["places"],
});

export default {
  name: "MappaTratte",
  data() {
    return {
      startDate: "",
      endDate: "",
      statusOptions: [
        "pending",
        "transportApproved",
        "adminApproved",
        "rejectedByTransport",
        "rejectedByAdmin",
        "finished"
      ],
      status: "pending",
      tratte: [],
      markers: [],
      AdvancedMarkerElement: null,
      defaultCenter: { lat: 46.06768, lng: 11.12426 },
      directionsService: null,
      directionsRenderer: null,
      durationInfoWindow: null,
      durationInMin: null,
      focusedTrattaId: null
    };
  },
  async mounted() {
    try{
      await loader.load();
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      this.AdvancedMarkerElement = AdvancedMarkerElement;

      this.mapInstance = new Map(document.getElementById("map"), {
        center: this.defaultCenter,
        zoom: 13,
        mapId: process.env.VUE_APP_GOOGLE_MAPS_ID,
      });


      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#007bff", // blu evidenziato
          strokeWeight: 6,
        }
      });
      this.directionsRenderer.setMap(this.mapInstance);

      this.startDate = this.$route.query.startDate || "";
        this.endDate = this.$route.query.endDate || "";
        this.status = this.$route.query.status || "pending";

        await this.fetchTratte();

        // Focus automatico sulla tratta se presente nei query param
        if (this.$route.query.trattaId) {
          const tratta = this.tratte.find(t => t._id === this.$route.query.trattaId);
          if (tratta) {
            this.focusTratta(tratta);
          }
        }
    }catch (error){
      console.error("Errore inizializzazione Google Maps:", error);
    }
  },
  methods: {
    async fetchTratte() { 
      const params = {
        startDate: this.startDate,
        endDate: this.endDate
      };
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await api.get(`/tratte/status/${this.status}/filter`, {
          headers,
          params
        });


        const tratteWithAddresses = await Promise.all(response.data.map(async tratta => {
          try {
            const res = await api.get(`/tratte/reverse-geocode`, {
              params: {
                lat: tratta.midpoint.lat,
                lon: tratta.midpoint.lon
              },
              headers
            });
            tratta.mapsAddress = res.data.address;
            tratta.mapsLink = res.data.mapsUrl;
          } catch (err) {
            console.warn('Errore reverse-geocode tratta:', err);
            tratta.mapsAddress = null;
            tratta.mapsLink = null;
          }
          return tratta;
        }));

        this.tratte = tratteWithAddresses;

        if (this.tratte.length === 0) {
          this.clearMap();
        }
      } catch (err) {
        console.error("Errore nel caricamento tratte:", err);
      }
    },
    focusTratta(tratta) {
      if (!this.mapInstance || !this.AdvancedMarkerElement) return;

      this.focusedTrattaId = tratta._id;
      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];

      const midpoint = tratta.midpoint;
      const eventLoc = tratta.event?.location;


      if (
        typeof midpoint?.lat !== 'number' || typeof midpoint?.lon !== 'number' ||
        typeof eventLoc?.lat !== 'number' || typeof eventLoc?.lon !== 'number'
      ) {
        console.warn("Coordinate non valide per la tratta o per l'evento.");
        return;
      }


      if (this.durationInfoWindow) {
        this.durationInfoWindow.close();
        this.durationInfoWindow = null;
        this.durationInMin = null;
      }
      this.directionsService.route(
        {
          origin: { lat: midpoint.lat, lng: midpoint.lon },
          destination: { lat: eventLoc.lat, lng: eventLoc.lon },
          travelMode: google.maps.TravelMode.DRIVING,
          transitOptions: {
            modes: ['BUS'] // forza solo autobus
          }
        },
        async (response, status) => {
          if (status === 'OK') {
            this.directionsRenderer.setDirections(response);

            const leg = response.routes[0].legs[0];
            this.durationInMin = Math.round(leg.duration.value / 60);

            try {
              const token = localStorage.getItem("token");
              const headers = token ? { Authorization: `Bearer ${token}` } : {};
              await api.put(`/tratte/${tratta._id}/transport`, {
                estimatedDuration: this.durationInMin
              }, { headers });

              tratta.estimatedDuration = this.durationInMin;
              console.log("Durata stimata aggiornata con successo." + this.durationInMin );
            } catch (error) {
              console.error("Errore aggiornamento estimatedDuration:", error);
            }

            const start = leg.start_location;
            const end = leg.end_location;

            const midLatLng = {
              lat: (start.lat() + end.lat()) / 2,
              lng: (start.lng() + end.lng()) / 2
            };


            const mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${midpoint.lat},${midpoint.lon}&destination=${eventLoc.lat},${eventLoc.lon}&travelmode=driving`;

            const durationInfo = new google.maps.InfoWindow({
              content: `
                <div style="font-weight:bold; color:#007bff; max-width: 250px;">
                  🕒 Durata stimata: ${this.durationInMin} min<br/>
                  <a href="${mapsLink}" target="_blank" style="color:#007bff; text-decoration: underline;">
                    📍 Avvia Navigazione
                  </a>
                </div>`
            });


            durationInfo.setPosition(midLatLng);
            durationInfo.open(this.mapInstance);
            this.durationInfoWindow = durationInfo;
          } else {
            console.error('Directions request failed:', status);
          }
        }
      );

      const trattaMarker = new this.AdvancedMarkerElement({
        map: this.mapInstance,
        position: { lat: midpoint.lat, lng: midpoint.lon },
        title: "Partenza tratta"
      });

      const trattaInfo = new google.maps.InfoWindow({
        content: this.buildInfoContentPartenza(tratta, this.durationInMin),
      });

      trattaMarker.addListener("gmp-click", () => {
        trattaInfo.open(this.mapInstance, trattaMarker);
      });

      this.markers.push(trattaMarker);

      const eventMarker = new this.AdvancedMarkerElement({
        map: this.mapInstance,
        position: { lat: eventLoc.lat, lng: eventLoc.lon },
        title: tratta.event?.title || "Evento"
      });

      const eventInfo = new google.maps.InfoWindow({
        content: this.buildInfoContentEvento(tratta.event),
      });

      eventMarker.addListener("gmp-click", () => {
        eventInfo.open(this.mapInstance, eventMarker);
      });

      this.markers.push(eventMarker);

      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: midpoint.lat, lng: midpoint.lon });
      bounds.extend({ lat: eventLoc.lat, lng: eventLoc.lon });
      this.mapInstance.fitBounds(bounds);
      this.mapInstance.setZoom(this.mapInstance.getZoom() - 0.25); // un piccolo zoom out manuale


    },

    resetFilters() {
      this.startDate = "";
      this.endDate = "";
      this.status = "adminApproved";
      this.clearMap();
      this.fetchTratte();
    },
    buildInfoContentPartenza(trattaPartenza, durationInMin) {
      const container = document.createElement("div");
      container.className = "info-window";

      const div = document.createElement("div");
      div.innerHTML = `<strong>Fermata Partenza</strong></br><strong>Partenza: ${new Date(trattaPartenza.departureTime).toLocaleString()}</strong><br/>Prenotazioni: 
          ${trattaPartenza.bookingCount} / ${trattaPartenza.capacity}<br/>
          Tempo previsto: ${trattaPartenza.estimatedDuration} min<br/> 
          Partenza: ${trattaPartenza.mapsAddress} `;
      div.style.cursor = "pointer";
      div.style.marginBottom = "8px";
      container.appendChild(div);
      return container;
    },
    buildInfoContentEvento(trattaEvento) {
      const container = document.createElement("div");
      container.className = "info-window";

      const div = document.createElement("div");
      div.innerHTML = `<strong>${trattaEvento.title}</strong><br/>
            ${trattaEvento.description}<br/>
            ${new Date(trattaEvento.date).toLocaleString()}<br/>
            ${trattaEvento.location.name ? `<em>${trattaEvento.location.name} - ${trattaEvento.location.address}</em>` : ""}`;
      div.style.cursor = "pointer";
      div.style.marginBottom = "8px";
      container.appendChild(div);
      return container;
    },
    clearMap() {
      if (!this.mapInstance) return;

      this.markers.forEach(marker => marker.setMap(null));
      this.markers = [];

      this.mapInstance.setCenter(this.defaultCenter);
      this.mapInstance.setZoom(13);
    }
  },
};
</script>

<style scoped>
.tratte-map-layout {
  display: flex;
  height: calc(100vh - 80px);
}

.filters-sidebar {
  width: 25%;
  padding: 20px;
  background-color: #fff;
  border-right: 1px solid #ddd;
  overflow-y: auto;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 15px;
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

.reset-button {
  padding: 10px 16px;
  background-color: #2e7d32;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.reset-button:hover {
  background-color: #1b5e20;
}

.tratte-cards {
  margin-top: 20px;
}

.tratta-card {
  border: 1px solid #ccc;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;
  background: #f9f9f9;
}

.tratta-card:hover {
  background-color: #e6f4ea;
  border-color: #2e7d32;
}

.tratta-card.focused {
  border: 2px solid #2e7d32;
  background-color: #e8f5e9;
}

.map-container {
  flex: 1;
  height: 100%;
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
