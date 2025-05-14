<template>
  <div class="calendar">
    <h2 class="text-2xl font-bold mb-4">Calendario Eventi</h2>
    <ul>
      <li v-for="event in events" :key="event._id" class="event-card">
        <h3 class="event-title">{{ event.title }}</h3>
        <p class="event-description">{{ event.description }}</p>
        <p class="event-date">📅 {{ new Date(event.date).toLocaleString() }}</p>
        <p class="event-location">📍 {{ event.location }}</p>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "AppCalendar",
  data() {
    return {
      events: []
    };
  },
  mounted() {
    this.fetchEvents();
  },
  methods: {
    async fetchEvents() {
      try {
        const token =  localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/calendar", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.events = response.data;
      } catch (error) {
        console.error("Errore nel recupero degli eventi:", error);
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
