<template>
  <div class="autocomplete-wrapper">
    <input
      :id="inputId"
      type="text"
      class="input"
      placeholder="Inserisci un indirizzo"
      autocomplete="off"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'

const emit = defineEmits(['address-selected'])

// Genera un ID univoco per ogni istanza
const inputId = `autocomplete-${Math.random().toString(36).substring(2, 10)}`
const GOOGLE_API_KEY = process.env.VUE_APP_GOOGLE_MAPS_API_KEY

let autocomplete = null

function onPlaceChanged() {
  const place = autocomplete.getPlace()
  if (!place.geometry) return

  emit('address-selected', {
    name: place.name,
    address: place.formatted_address || '',
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
  })
}

onMounted(async () => {
  const loader = new Loader({
    apiKey: GOOGLE_API_KEY,
    version: 'weekly',
    libraries: ['places'],
  })

  await loader.load()

  const input = document.getElementById(inputId)
  if (!input) return

  autocomplete = new google.maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: ['IT'] },
    fields: ['place_id', 'geometry', 'name', 'formatted_address'],
  })

  autocomplete.addListener('place_changed', onPlaceChanged)
})
</script>

<style scoped>
.autocomplete-wrapper {
  width: 100%;
  position: relative;
}
.input {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}
</style>
