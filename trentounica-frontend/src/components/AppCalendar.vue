<template>
  <div class="calendar-wrapper">
    <!-- Bottone indietro -->
    <button class="back-button" @click="$router.back()">← Torna indietro</button>

    <div class="calendar">
      <h2>Calendario Eventi</h2>

      <div class="filters">
        <label>
          Data Inizio:
          <input type="date" v-model="startDate" @change="fetchEvents" />
        </label>
        <label>
          Data Fine:
          <input type="date" v-model="endDate" @change="fetchEvents" />
        </label>
        <label>
          Categoria:
          <select v-model="category" @change="fetchEvents">
            <option value="">Tutte</option>
            <option value="bar">Bar</option>
            <option value="discoteca">Discoteca</option>
            <option value="concerto">Concerto</option>
          </select>
        </label>
        <label v-if="role === 'organizer'" class="checkbox-inline">
          <span style="font-size: 14px;">Solo i miei eventi</span>
          <input type="checkbox" v-model="showOnlyMine" @change="fetchEvents" />
        </label>
        <label v-if="role === 'client'" class="checkbox-inline">
          <span style="font-size: 14px;">Solo i miei eventi preferiti</span>
          <input type="checkbox" v-model="showOnlyPreferred" @change="fetchEvents" />
        </label>
        <button @click="resetFilters">Reset filtri</button>
      </div>

      <div ref="calendar" id="calendar"></div>
    </div>

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
      loadingExport: false, // Variabile per il caricamento
      showOnlyMine: false,
      showOnlyPreferred: false,
      role: localStorage.getItem("role") || ""
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
        if (this.role === 'organizer' && this.showOnlyMine) {
          params.onlyMine = true;
        }
        if (this.role === 'client' && this.showOnlyPreferred) {
          params.onlyPreferred = true;
        }

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
      this.showOnlyMine = false;
      this.showOnlyPreferred = false;
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
.calendar-wrapper {
  padding: 60px 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  position: relative;
}

.back-button {
  position: absolute;
  top: 15px;
  left: 20px;
  background: transparent;
  border: none;
  color: #2e7d32;
  font-size: 14px;
  cursor: pointer;
}
.back-button:hover {
  text-decoration: underline;
}

.calendar {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

h2 {
  text-align: center;
  color: #2e7d32;
  margin-bottom: 25px;
}

#calendar {
  margin-top: 20px;
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
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #333;
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
}
.filters button:hover {
  background-color: #1b5e20;
}

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
</style>
