<template>
  <div class="stats-container">
    <h1>Statistiche Eventi per Data</h1>

    <div class="date-filter">
      <label for="data">Seleziona una data:</label>
      <input type="date" id="data" v-model="selectedDate" />
    </div>

    <h2>Mappa dei Flussi</h2>
    <div class="time-filters">
      <label for="start-hour">Ora inizio (opzionale):</label>
      <select id="start-hour" v-model="startHour">
        <option value="">--</option>
        <option v-for="h in 24" :key="'start-' + h" :value="h - 1">{{ (h - 1).toString().padStart(2, '0') }}:00</option>
      </select>

      <label for="end-hour">Ora fine (opzionale):</label>
      <select id="end-hour" v-model="endHour">
        <option value="">--</option>
        <option v-for="h in 24" :key="'end-' + h" :value="h">{{ (h).toString().padStart(2, '0') }}:00</option>
      </select>
    </div>
    <FlowMap :date="selectedDate" :startHour="startHour" :endHour="endHour" />

    <h2>Istogramma Presenze</h2>
    <AttendanceHistogram :date="selectedDate" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FlowMap from '@/components/FlowMap.vue'
import AttendanceHistogram from '@/components/AttendanceHistogram.vue'

const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)
const startHour = ref('')
const endHour = ref('')
</script>

<style scoped>
.stats-container {
  max-width: 1000px;
  margin: 60px auto;
  padding: 20px;
  text-align: center;
}

.date-filter,
.time-filters {
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

label {
  margin-right: 0.3rem;
}

select {
  padding: 0.3rem;
  font-size: 0.95rem;
}

input[type="date"] {
  padding: 0.5rem;
  font-size: 1rem;
}

h2 {
  margin: 2rem 0 1rem;
}
</style>