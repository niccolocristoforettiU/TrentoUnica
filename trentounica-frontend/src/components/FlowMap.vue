<template>
  <div>
    <div v-if="isLoadingFlows || (loadingProgress > 0 && loadingProgress < 100)" style="margin-bottom: 10px; color: #555;">
      Sto generando i flussi... {{ loadingProgress }}%
    </div>
    <div style="margin-bottom: 10px;">
      <label><input type="checkbox" v-model="selectedFlowTypes" value="main" /> Flussi principali</label>
    </div>
    <div v-if="exportProgress > 0 && exportProgress < 100" style="margin-bottom: 10px; color: #555;">
      Esportazione CSV: {{ exportProgress }}%
    </div>
    <button @click="exportCSV" style="margin-bottom: 10px;">
      Esporta dati come CSV
    </button>
    <div v-if="!isLoadingFlows && flows.length === 0 && loadingProgress === 100" style="margin-bottom: 10px; color: gray;">
      Nessun flusso disponibile per il periodo selezionato.
    </div>
    <div ref="mapContainer" style="position: relative">
      <l-map ref="map" :zoom="13" :center="[46.0701, 11.119]" style="height: 600px; width: 100%">
        <l-tile-layer :url="tileUrl" :attribution="tileAttribution" />
        <l-polyline
          v-for="(s, idx) in aggregatedSegments"
          :key="'line-' + idx"
          :lat-lngs="s.route"
          :color="s.mode === 'walking'
            ? (s.weight / maxSegmentWeight >= 0.8 ? '#1b5e20' : s.weight / maxSegmentWeight >= 0.5 ? '#c0ca33' : '#a5d6a7')
            : (s.weight / maxSegmentWeight >= 0.8 ? '#0d47a1' : s.weight / maxSegmentWeight >= 0.5 ? '#42a5f5' : '#b3e5fc')"
          :weight="Math.max(3, s.weight)"
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
          <l-tooltip :content="`${Math.ceil(g.totalWeight)} persone - ${g.name || 'Location'}`" :permanent="true" direction="top" />
        </l-circle-marker>
      </l-map>
      <div class="legend-toggle" @click="showLegend = !showLegend">
        {{ showLegend ? 'Nascondi legenda' : 'Mostra legenda' }}
      </div>
      <div v-if="showLegend" class="legend-popup">
        <h3>Legenda</h3>
        <div class="legend-item">
          <span class="legend-line low"></span>
          Basso flusso (0–{{ lowThreshold }})
        </div>
        <div class="legend-item">
          <span class="legend-line medium"></span>
          Medio flusso ({{ lowThreshold + 1 }}–{{ highThreshold }})
        </div>
        <div class="legend-item">
          <span class="legend-line high"></span>
          Alto flusso ({{ highThreshold + 1 }}+)
        </div>
        <div class="legend-item">
          <span class="legend-line walk-low"></span>
          Basso flusso a piedi (0–{{ lowThreshold }})
        </div>
        <div class="legend-item">
          <span class="legend-line walk-medium"></span>
          Medio flusso a piedi ({{ lowThreshold + 1 }}–{{ highThreshold }})
        </div>
        <div class="legend-item">
          <span class="legend-line walk-high"></span>
          Alto flusso a piedi ({{ highThreshold + 1 }}+)
        </div>
        <div class="legend-item">
          <span class="legend-circle"></span>
          Punto di afflusso (il diametro scala in base al numero di persone)
        </div>
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
  background-color: #1e88e5;
}
.legend-line.medium {
  background-color: #1976d2;
}
.legend-line.high {
  background-color: #1565c0;
}
.legend-line.poi {
  background-color: #00cc66;
}
.legend-line.walk {
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
  background-color: #b3e5fc; /* auto - basso */
}
.legend-popup .legend-line.medium {
  background-color: #42a5f5; /* auto - medio */
}
.legend-popup .legend-line.high {
  background-color: #0d47a1; /* auto - alto */
}
.legend-popup .legend-line.poi {
  background-color: #00cc66;
}
.legend-popup .legend-line.walk-low {
  background-color: #a5d6a7; /* piedi - basso */
}
.legend-popup .legend-line.walk-medium {
  background-color: #c0ca33; /* piedi - medio */
}
.legend-popup .legend-line.walk-high {
  background-color: #1b5e20; /* piedi - alto */
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

const props = defineProps({
  date: String,
  startHour: [String, Number],
  endHour: [String, Number]
})

const flows = ref([])

const loadingProgress = ref(0)
const isLoadingFlows = ref(false)

const selectedFlowTypes = ref(['main'])

const exportProgress = ref(0);

const aggregatedSegments = computed(() => {
  const segments = new Map();

  for (const f of flows.value) {
    const points = f.route;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const key = `${a.lat.toFixed(5)},${a.lon.toFixed(5)}|${b.lat.toFixed(5)},${b.lon.toFixed(5)}`;
      const reverseKey = `${b.lat.toFixed(5)},${b.lon.toFixed(5)}|${a.lat.toFixed(5)},${a.lon.toFixed(5)}`;

      const existing = segments.get(key) || segments.get(reverseKey);
      const weight = f.weight || 1;

      if (existing) {
        existing.weight += weight;
        existing.modes.push(f.mode);
      } else {
        segments.set(key, {
          route: [a, b],
          weight,
          modes: [f.mode]
        });
      }
    }
  }

  for (const seg of segments.values()) {
    const modeCounts = seg.modes.reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});
    seg.mode = modeCounts.walking >= (modeCounts.driving || 0) ? 'walking' : 'driving';
    delete seg.modes;
  }

  return Array.from(segments.values());
});

const maxSegmentWeight = computed(() => {
  return Math.max(...aggregatedSegments.value.map(s => s.weight), 1);
});

const lowThreshold = computed(() => Math.floor(maxSegmentWeight.value * 0.5));
const highThreshold = computed(() => Math.floor(maxSegmentWeight.value * 0.8));

const groupedFlows = computed(() => {
  const groups = {}
  for (const f of flows.value) {
    if (f.type !== 'to_event' || !f.eventLocationName) continue
    if (f.mode === 'walking') {
      const last = f.route.at(-1)
      const secondLast = f.route.at(-2)
      // Se la tratta è molto breve o non ha movimento, la saltiamo
      if (secondLast && last.lat === secondLast.lat && last.lon === secondLast.lon) continue
      // Escludi i flussi pedonali che terminano ai parcheggi (cioè che partono da un parcheggio e non vanno verso un evento)
      // Qui assumiamo che i flussi pedonali che non puntano a un evento abbiano un qualche identificativo, ma con le informazioni date, filtriamo solo se la tratta è 'inutile'
    }
    const dest = f.route.at(-1)
    if (!dest?.lat || !dest?.lon) continue
    const key = `${dest.lat.toFixed(5)},${dest.lon.toFixed(5)}`
    if (!groups[key]) {
      groups[key] = { lat: dest.lat, lon: dest.lon, totalWeight: 0, route: f.route, name: f.eventLocationName }
    }
    groups[key].totalWeight += f.weight
  }
  return Object.values(groups)
})

const mapContainer = ref(null)
const map = ref(null)

const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const tileAttribution = '&copy; CartoDB, &copy; OpenStreetMap contributors'

const showLegend = ref(true)

let serverProgress = 0;

const fetchFlows = async () => {
  if (!props.date) {
    console.warn("Data non fornita a FlowMap.vue");
    return;
  }

  isLoadingFlows.value = true;
  loadingProgress.value = 0;
  serverProgress = 0;
  flows.value = [];

  try {
    const res = await axios.post('/admin/stats/flows/async', {
      date: props.date,
      startHour: props.startHour || null,
      endHour: props.endHour || null
    });

    const jobId = res.data.jobId;

    const interval = setInterval(async () => {
      if (!isLoadingFlows.value) {
        clearInterval(interval);
        return;
      }

      try {
        const progressRes = await axios.get(`/admin/stats/flows/async/${jobId}/progress`);
        serverProgress = progressRes.data.progress;

        if (loadingProgress.value < serverProgress) {
          loadingProgress.value += 1;
        }

        if (progressRes.data.status === 'done') {
          loadingProgress.value = 100;
          const resultRes = await axios.get(`/admin/stats/flows/async/${jobId}/result`);
          const resultFlows = resultRes.data.flows || [];
          flows.value = resultFlows.map(f => ({
            ...f,
            weight: f.weight ?? 1
          }));
          isLoadingFlows.value = false;
          clearInterval(interval);
        }

        if (progressRes.data.status === 'error') {
          console.error("Errore nel job asincrono");
          isLoadingFlows.value = false;
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Errore nel polling del progresso:", err);
        isLoadingFlows.value = false;
        clearInterval(interval);
      }
    }, 1000);

  } catch (err) {
    console.error("Errore nell'avvio del job asincrono:", err);
    isLoadingFlows.value = false;
  }
};


onMounted(() => {
  fetchFlows()
})
watch(() => [props.date, props.startHour, props.endHour], fetchFlows)

// Esporta i dati flussi come CSV con delimitatore ;, BOM UTF-8 e quoting dei percorsi
const exportCSV = async () => {
  exportProgress.value = 0;
  const headers = [
    'type', 
    'mode', 
    'weight', 
    'route_lat_lon', 
    'eventLocationName',
    'eventStart',
    'eventEnd',
    'date',
    'startHour',
    'endHour'
  ];
  const rows = [];

  const totalRows = flows.value.length + groupedFlows.value.length;
  let processedRows = 0;

  for (const flow of flows.value) {
    const routeString = flow.route.map(p => `${p.lat.toFixed(5)}:${p.lon.toFixed(5)}`).join(' -> ');
    rows.push([
      flow.type || '',
      flow.mode || '',
      flow.weight || '',
      `"${routeString}"`,
      flow.eventLocationName || '',
      flow.eventStart ? new Date(flow.eventStart).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : '',
      flow.eventEnd ? new Date(flow.eventEnd).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : '',
      props.date || '',
      props.startHour || '',
      props.endHour || ''
    ]);
    processedRows++;
    exportProgress.value = Math.floor((processedRows / totalRows) * 100);
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  for (const g of groupedFlows.value) {
    rows.push([
      'grouped',
      '',
      g.totalWeight || '',
      `"${g.lat.toFixed(5)}:${g.lon.toFixed(5)}"`,
      g.name || '',
      props.date || '',
      props.startHour || '',
      props.endHour || ''
    ]);
    processedRows++;
    exportProgress.value = Math.floor((processedRows / totalRows) * 100);
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `flow_data_${props.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  exportProgress.value = 100;
};
</script>