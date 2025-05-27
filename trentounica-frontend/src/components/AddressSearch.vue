<template>
  <div class="autocomplete-wrapper">
    <div :id="autocompleteElementId" class="autocomplete-element"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'

const emit = defineEmits(['address-selected'])

const autocompleteElementId = `autocomplete-${Math.random().toString(36).substring(2, 10)}`
const GOOGLE_API_KEY = process.env.VUE_APP_GOOGLE_MAPS_API_KEY


onMounted(async () => {
  const loader = new Loader({
    apiKey: GOOGLE_API_KEY,
    version: 'weekly',
    libraries: ['places'],
  })

  await loader.load()
  await google.maps.importLibrary('places')

  const container = document.getElementById(autocompleteElementId)
  if (!container) return

  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
    componentRestrictions: { country: ['it'] },
  })

  container.appendChild(placeAutocomplete)

  placeAutocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
    const place = placePrediction.toPlace();
    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
    emit('address-selected', {
      name: place.displayName,
      address: place.formattedAddress,
      lat: place.location.lat(),
      lng: place.location.lng(),
    })
})
})
</script>

<style scoped>
.autocomplete-element {
  width: 100%;
  background: white;
  border-radius: 6px;
  border: 1px solid #ccc;
  box-sizing: border-box;
  padding: 0; /* reset padding here, padding goes to input */
  font-size: 16px;
}

/* Se il componente crea un input al suo interno */
.autocomplete-element input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  font-size: 16px;
  border-radius: 6px;
  border: none; /* input interno senza bordo, perché c'è già quello del wrapper */
  background: white;
  outline: none;
}

/* Focus sull'input */
.autocomplete-element input:focus {
  border-color: #2e7d32; /* verde */
  outline: none;
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.3); /* effetto focus più evidente */
}
</style>
