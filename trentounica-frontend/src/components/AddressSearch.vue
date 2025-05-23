<template>
  <div class="address-wrapper">
    <input
      type="text"
      v-model="query"
      @input="onInput"
      @blur="handleBlur"
      @focus="onInput"
      placeholder="Indirizzo location"
      class="input"
      autocomplete="off"
    />
    <ul v-if="showList && suggestions.length" class="suggestion-list">
      <li
        v-for="(suggestion, index) in suggestions"
        :key="index"
        @mousedown.prevent="selectSuggestion(suggestion)"
      >
        {{ suggestion.description }}
      </li>
    </ul>
  </div>
</template>

<!-- eslint-disable no-undef -->
<script setup>
const emit = defineEmits(['address-selected'])
/* global google */
import { ref, onMounted } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'

const query = ref('')
const suggestions = ref([])
const showList = ref(false)

let sessionToken = null
let autocompleteService = null
let placesService = null


async function initGoogleMaps() {
  const loader = new Loader({
    apiKey: process.env.VUE_APP_GOOGLE_MAPS_API_KEY,
    version: 'weekly',
    libraries: ['places'],
  })
  await loader.load()

  sessionToken = new google.maps.places.AutocompleteSessionToken()
  autocompleteService = new google.maps.places.AutocompleteService()
  placesService = new google.maps.places.PlacesService(document.createElement('div'))
}

onMounted(() => {
  initGoogleMaps()
})

function onInput() {
  if (!query.value || !autocompleteService) {
    suggestions.value = []
    return
  }

  showList.value = true

  autocompleteService.getPlacePredictions(
    {
      input: query.value,
      types: ['address'],
      componentRestrictions: { country: 'it' },
      sessionToken: sessionToken,
    },
    (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        suggestions.value = predictions
      } else {
        suggestions.value = []
      }
    }
  )
}

function selectSuggestion(suggestion) {
  showList.value = false
  query.value = suggestion.description
  suggestions.value = []

  if (!placesService) return

  placesService.getDetails(
    {
      placeId: suggestion.place_id,
      fields: ['formatted_address', 'geometry', 'address_components'],
      sessionToken
    },
    (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        query.value = place.formatted_address

        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()

        // ✅ Emit full address data to parent
        emit('address-selected', {
          address: place.formatted_address,
          lat,
          lng
        })
      }
    }
  )
}


function handleBlur() {
  setTimeout(() => {
    showList.value = false
  }, 100)
}
</script>

<style scoped>
.address-wrapper {
  max-width: 300px;
  width: 100%;
  margin: 0 auto;
  position: relative;
  display: block;
}

.input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  font-size: 16px;
  box-sizing: border-box;
}

.suggestion-list {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  width: 100%;
  list-style: none;
  margin: 0;
  padding: 0;
  z-index: 1000;
}

.suggestion-list li {
  padding: 8px;
  cursor: pointer;
}

.suggestion-list li:hover {
  background-color: #f0f0f0;
}
</style>
