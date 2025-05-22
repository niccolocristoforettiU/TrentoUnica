<template>
  <div class="calendar">
    <h2 class="text-2xl font-bold mb-4">Calendario Eventi</h2>
    <div class="filters mb-4">
      <label for="startDate">Data Inizio:</label>
      <input type="date" v-model="startDate" @change="fetchEvents" />
      <label for="endDate">Data Fine:</label>
      <input type="date" v-model="endDate" @change="fetchEvents" />
      <label for="category">Categoria:</label>
      <select v-model="category" @change="fetchEvents">
        <option value="">Tutte</option>
        <option value="bar">Bar</option>
        <option value="discoteca">Discoteca</option>
        <option value="concerto">Concerto</option>
      </select>
      <button @click="resetFilters">Reset filtri</button>
    </div>
    <div ref="calendar" id="calendar"></div>
    <div v-if="loadingExport" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Esportazione in corso...</p>
    </div>
  </div>
</template>

<script>
import api from "@/api/axios";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default {
  name: "AppCalendar",
  data() {
    return {
      calendar: null,
      events: [],
      startDate: "",
      endDate: "",
      category: "",
      loadingExport: false // Variabile per il caricamento
    };
  },
  mounted() {
    this.fetchEvents();
  },
  methods: {
    async fetchEvents() {
      try {
        const params = {};
        if (this.startDate) params.startDate = this.startDate;
        if (this.endDate) params.endDate = this.endDate;
        if (this.category) params.category = this.category;

        const response = await api.get("/calendar", {
          params
        });
        
        this.events = response.data;
        this.initCalendar();
      } catch (error) {
        console.error("Errore nel recupero degli eventi:", error);
      }
    },
    resetFilters() {
      this.startDate = "";
      this.endDate = "";
      this.category = "";
      this.fetchEvents();
    },
    initCalendar() {
      if (this.calendar) {
        this.calendar.destroy();
      }
      this.calendar = new Calendar(this.$refs.calendar, {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: "dayGridMonth",
        events: this.events.map(event => ({
          title: event.title,
          start: event.date,
          description: event.description,
          location: event.location?.name || "Sconosciuto",
          id: event._id
        })),
        eventClick: this.handleEventClick
      });
      this.calendar.render();
    },
    async exportEvent(info) {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Devi essere autenticato per esportare l'evento.");
        return;
      }

      this.loadingExport = true;
      try {
        const response = await api.get(`/calendar/export/${info.event.id}`, {
          responseType: 'blob' // Ricevi il file come blob
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${info.event.title || 'event'}.ics`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error("Errore durante l'esportazione dell'evento:", error);
        alert("Errore durante l'esportazione dell'evento.");
      } finally {
        this.loadingExport = false;
      }
    },
    handleEventClick(info) {
      const scelta = confirm("Vuoi esportare questo evento nel tuo calendario personale?\nPremi Annulla per visualizzare i dettagli.");
      if (scelta) {
        this.exportEvent(info);
      } else {
        this.$router.push(`/event/${info.event.id}`);
      }
    }
  }
};
</script>

<style scoped>
.calendar {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

#calendar {
  margin-top: 20px;
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters label {
  margin-right: 10px;
}

.event-card {
  background-color: #ffffff;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.event-title {
  font-size: 1.5em;
  font-weight: bold;
}

.event-description {
  color: #555;
}

.event-date,
.event-location {
  color: #888;
  font-size: 0.9em;
}
</style>

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 1.2em;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #fff;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
