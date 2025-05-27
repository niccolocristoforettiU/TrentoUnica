<template>
  <div class="stats-container">
    <h1>Statistiche Organizer</h1>

    <div class="filters">
      <label for="start">Data Inizio:</label>
      <input type="date" :min="minDate" v-model="startDate" />

      <label for="end">Data Fine:</label>
      <input type="date" :min="minDate" v-model="endDate" />

      <label for="category">Categoria:</label>
      <select v-model="selectedCategory">
        <option value="">Tutte</option>
        <option value="bar">Bar</option>
        <option value="discoteca">Discoteca</option>
        <option value="concerto">Concerto</option>
      </select>

    </div>

    <OrganizerPreferenceHistogram
      :startDate="startDate"
      :endDate="endDate"
      :category="selectedCategory"
      :organizerOnly="onlyMine"
    />

    <OrganizerBookingHistogram
      :startDate="startDate"
      :endDate="endDate"
      :category="selectedCategory"
      :organizerOnly="onlyMine"
    />

    <OrganizerRevenueHistogram
      :startDate="startDate"
      :endDate="endDate"
      :category="selectedCategory"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import OrganizerPreferenceHistogram from '@/components/OrganizerPreferenceHistogram.vue';
import OrganizerBookingHistogram from '@/components/OrganizerBookingHistogram.vue';
import OrganizerRevenueHistogram from '@/components/OrganizerRevenueHistogram.vue';

const today = new Date();
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(today.getMonth() - 1);

const formatDate = (d) => d.toISOString().split('T')[0];
const minDate = formatDate(oneMonthAgo);

const startDate = ref(minDate);
const endDate = ref('');
const selectedCategory = ref('');
const onlyMine = ref(false);
</script>

<style scoped>
.stats-container {
  max-width: 1000px;
  margin: 60px auto;
  padding: 20px;
  text-align: center;
}

.filters {
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

select,
input[type="date"] {
  padding: 0.3rem;
  font-size: 0.95rem;
}

h2 {
  margin: 2rem 0 1rem;
}
</style>