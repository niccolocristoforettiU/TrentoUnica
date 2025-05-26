<template>
  <div>
    <button @click="exportChartAsImage" style="margin-bottom: 10px">
      Esporta istogramma come PNG
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
import html2canvas from 'html2canvas'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

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

    const labels = data.map(event => event.title)
    const datasetByAge = ageGroups.map(group => ({
      label: group,
      data: data.map(e => e.ageGroups[group] || 0),
      backgroundColor: ageColors[group],
      stack: 'stack1'
    }))

    chartData.value = {
      labels,
      datasets: datasetByAge
    }
  } catch (err) {
    console.error(err)
  }
}

const exportChartAsImage = async () => {
  const canvas = chartComponent.value?.$el?.querySelector('canvas')
  if (!canvas) return
  const image = await html2canvas(canvas)
  const link = document.createElement('a')
  link.download = `istogramma_presenze_${props.date}.png`
  link.href = image.toDataURL()
  link.click()
}

onMounted(fetchData)
watch(() => props.date, fetchData)
</script>
