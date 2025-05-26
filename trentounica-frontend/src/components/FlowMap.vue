<template>
  <div>
    <button @click="exportMapAsImage" style="margin-bottom: 10px">
      Esporta mappa come PNG
    </button>
    <div style="margin-bottom: 10px;">
      <label><input type="checkbox" v-model="selectedFlowTypes" value="main" /> Flussi principali</label>
      <label><input type="checkbox" v-model="selectedFlowTypes" value="poi" /> Post-evento (POI)</label>
    </div>
    <div v-if="flows.length === 0" style="margin-bottom: 10px; color: gray;">
      Nessun flusso disponibile per il pediodo selezionato.
    </div>
    <div ref="mapContainer" style="position: relative">
      <l-map :zoom="13" :center="[46.0701, 11.119]" style="height: 600px; width: 100%">
        <l-tile-layer :url="tileUrl" :attribution="tileAttribution" />
        <l-polyline
          v-for="(f, idx) in filteredFlows"
          :key="'line-' + idx"
          :lat-lngs="f.route"
          :color="f.weight >= 0.9 ? '#003399' : f.weight >= 0.7 ? '#3366cc' : f.weight >= 0.5 ? '#FF8C00' : '#00cc66'"
          :weight="Math.max(3, f.weight * 2)"
          :opacity="0.8"
        />
        <l-circle-marker
          v-for="(g, idx) in groupedFlows"
          :key="'marker-' + idx"
          :lat-lng="g.route.at(-1)"
          :radius="Math.min(50, 10 + g.totalWeight * 2)"
          :fill-opacity="0.6"
          :weight="2"
          :color="g.totalWeight > 10 ? 'darkred' : 'red'"
        >
          <l-tooltip :content="`${Math.ceil(g.totalWeight)} persone`" :permanent="true" direction="top" />
        </l-circle-marker>
      </l-map>
      <div class="legend-toggle" @click="showLegend = !showLegend">
        {{ showLegend ? 'Nascondi legenda' : 'Mostra legenda' }}
      </div>
      <div v-if="showLegend" class="legend-popup">
        <h3>Legenda</h3>
        <div class="legend-item"><span class="legend-line low"></span> Basso flusso</div>
        <div class="legend-item"><span class="legend-line medium"></span> Medio flusso</div>
        <div class="legend-item"><span class="legend-line high"></span> Alto flusso</div>
        <div class="legend-item"><span class="legend-line poi"></span> Flusso post-evento (POI)</div>
        <div class="legend-item"><span class="legend-circle"></span> Punto di afflusso (dimensione proporzionale)</div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.legend {
  margin-top: 20px;
  padding: 10px;
  background: #f4f4f4;
  border-radius: 8px;
  width: fit-content;
  font-size: 0.9rem;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.legend-line {
  width: 30px;
  height: 4px;
  display: inline-block;
  margin-right: 10px;
}

.legend-line.low {
  background-color: #FF8C00;
}
.legend-line.medium {
  background-color: #3366cc;
}
.legend-line.high {
  background-color: #003399;
}
.legend-line.poi {
  background-color: #00cc66;
}

.legend-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: darkred;
  margin-right: 10px;
}

.legend-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ffffff;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;
  font-size: 0.85rem;
}

.legend-popup {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(255,255,255,0.95);
  padding: 10px;
  border-radius: 8px;
  font-size: 0.85rem;
  z-index: 999;
  box-shadow: 0 0 6px rgba(0,0,0,0.2);
  width: fit-content;
}

.legend-popup .legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.legend-popup .legend-line {
  width: 30px;
  height: 4px;
  display: inline-block;
  margin-right: 10px;
}

.legend-popup .legend-line.low {
  background-color: #FF8C00;
}
.legend-popup .legend-line.medium {
  background-color: #3366cc;
}
.legend-popup .legend-line.high {
  background-color: #003399;
}
.legend-popup .legend-line.poi {
  background-color: #00cc66;
}

.legend-popup .legend-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: darkred;
  margin-right: 10px;
}
</style>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { LMap, LTileLayer, LPolyline, LCircleMarker, LTooltip } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import axios from "@/api/axios";
import html2canvas from 'html2canvas'

const props = defineProps({
  date: String,
  startHour: [String, Number],
  endHour: [String, Number]
})

const flows = ref([])

const selectedFlowTypes = ref(['main', 'poi'])

const filteredFlows = computed(() => {
  return flows.value.filter(f => {
    if (f.weight >= 0.5) {
      return selectedFlowTypes.value.includes('main')
    } else {
      return selectedFlowTypes.value.includes('poi')
    }
  })
})

const groupedFlows = computed(() => {
  const groups = {}
  for (const f of flows.value) {
    const dest = f.route.at(-1)
    if (!dest?.lat || !dest?.lon) continue
    const key = `${dest.lat.toFixed(5)},${dest.lon.toFixed(5)}`
    if (!groups[key]) {
      groups[key] = { lat: dest.lat, lon: dest.lon, totalWeight: 0, route: f.route }
    }
    groups[key].totalWeight += f.weight
  }
  return Object.values(groups)
})

const mapContainer = ref(null)

const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const tileAttribution = '&copy; CartoDB, &copy; OpenStreetMap contributors'

const showLegend = ref(true)

const fetchFlows = async () => {
  if (!props.date) {
    console.warn("Data non fornita a FlowMap.vue")
    return
  }
  try {
    const params = new URLSearchParams({ date: props.date })
    if (props.startHour !== '' && props.startHour !== null) {
      params.append('startHour', props.startHour)
    }
    if (props.endHour !== '' && props.endHour !== null) {
      params.append('endHour', props.endHour)
    }

    const res = await axios.get(`/admin/stats/flows?${params.toString()}`)
    flows.value = res.data.flows
    console.log('Flussi ricevuti:', flows.value)
  } catch (err) {
    console.error("Errore nel recupero dei flussi:", err)
  }
}

const exportMapAsImage = async () => {
  if (!mapContainer.value) {
    console.warn("Contenitore mappa non trovato per esportazione.")
    return
  }
  const canvas = await html2canvas(mapContainer.value)
  const link = document.createElement('a')
  link.download = `mappa_flussi_${props.date}.png`
  link.href = canvas.toDataURL()
  link.click()
}

onMounted(fetchFlows)
watch(() => [props.date, props.startHour, props.endHour], fetchFlows)
</script>