<template>
  <div>
    <h2>Ricavi Eventi a Pagamento</h2>

    <canvas ref="chartCanvas"></canvas>

    <button @click="exportCSV">Esporta CSV</button>
  </div>
</template>

<script>
import axios from "@/api/axios";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  props: ['startDate', 'endDate', 'category'],
  data() {
    return {
      rawData: [],
      chart: null
    };
  },
  watch: {
    startDate: 'fetchData',
    endDate: 'fetchData',
    category: 'fetchData'
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const res = await axios.get('/organizer/stats/revenues', {
          params: {
            startDate: this.startDate,
            endDate: this.endDate,
            category: this.category
          }
        });
        this.rawData = res.data;
        this.renderChart();
      } catch (error) {
        console.error('Errore nel caricamento dati ricavi:', error);
      }
    },
    renderChart() {
      if (this.chart) {
        this.chart.destroy();
      }

      const labels = this.rawData.map(e => e.title);
      const data = this.rawData.map(e => e.revenue);

      const ctx = this.$refs.chartCanvas.getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Ricavi (€)',
            data,
            backgroundColor: '#1abc9c'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    },
    exportCSV() {
      const rows = [['Evento', 'Data Inizio', 'Data Fine', 'Location', 'Ricavi (€)']];

      this.rawData.forEach(e => {
        rows.push([
          e.title,
          new Date(e.startDate).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
          new Date(e.endDate).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
          e.location,
          e.revenue
        ]);
      });

      const csvContent = rows.map(r => r.join(';')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'ricavi_eventi.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
</script>