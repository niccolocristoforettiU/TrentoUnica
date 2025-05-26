<template>
  <div>
    <div v-if="loadingProgress > 0 && loadingProgress < 100" style="margin-bottom: 10px; color: #555;">
      Caricamento: {{ loadingProgress }}%
    </div>
    <button @click="exportHistogramAsCSV" style="margin-bottom: 10px">
      Esporta dati istogramma come CSV
    </button>
    <Bar v-if="chartData" :data="chartData" :options="chartOptions" ref="chartComponent" />
    <p v-else>Caricamento istogramma...</p>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'
import axios from "@/api/axios";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const loadingProgress = ref(0);

const props = defineProps({
  date: String
})

const chartComponent = ref(null)
const chartData = ref(null)

const ageGroups = ['0-17', '18-30', '31-45', '46-60', '60+']

const ageColors = {
  '0-17': '#FF6384',
  '18-30': '#36A2EB',
  '31-45': '#FFCE56',
  '46-60': '#4BC0C0',
  '60+': '#9966FF'
}

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: "Presenze stimate per evento e fascia d'età" }
  },
  scales: {
    x: { stacked: true },
    y: { stacked: true }
  }
}

const fetchData = async () => {
  if (!props.date) return
  try {
    const res = await axios.get(`/admin/stats/histogram?date=${props.date}`)
    const data = res.data.histogram

    const dataWithDates = data.map(e => ({
      ...e,
      startDate: new Date(e.startDate).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }),
      endDate: new Date(e.endDate).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })
    }));

    loadingProgress.value = 0;
    const total = dataWithDates.length;
    for (let i = 0; i < total; i++) {
      await new Promise(resolve => setTimeout(resolve, 0));
      loadingProgress.value = Math.floor(((i + 1) / total) * 100);
    }

    const labels = dataWithDates.map(event => event.title)
    const datasetByAge = ageGroups.map(group => ({
      label: group,
      data: dataWithDates.map(e => e.ageGroups[group] || 0),
      backgroundColor: ageColors[group],
      stack: 'stack1'
    }))

    chartData.value = {
      labels,
      datasets: datasetByAge,
      rawData: dataWithDates
    }
  } catch (err) {
    console.error(err)
  }
}


const exportHistogramAsCSV = () => {
  if (!chartData.value) return;

  loadingProgress.value = 0;

  const data = chartData.value.rawData;
  const headers = ['Evento', 'Data Inizio', 'Data Fine', ...ageGroups];
  const rows = [];
  const total = data.length;
  data.forEach((event, i) => {
    const row = [event.title, event.startDate, event.endDate];
    chartData.value.datasets.forEach(dataset => {
      row.push(dataset.data[i]);
    });
    rows.push(row);
    loadingProgress.value = Math.floor(((i + 1) / total) * 100);
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `istogramma_presenze_${props.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(fetchData)
watch(() => props.date, fetchData)
</script>
