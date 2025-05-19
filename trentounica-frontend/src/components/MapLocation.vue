<template>
  <div id="map" style="height: 400px; width: 100%;"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

onMounted(() => {
  // Coordinates for Trento, Italy
  const lat = 46.0667
  const lng = 11.1167

  // Create the map
  const map = L.map('map').setView([lat, lng], 13)

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  // Add marker at Trento
  L.marker([lat, lng]).addTo(map).bindPopup('Trento, Italy').openPopup()
})
</script>
