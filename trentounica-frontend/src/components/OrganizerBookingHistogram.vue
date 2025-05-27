<template>
  <div>
    <h2>Prenotazioni Eventi (per età)</h2>

    <label>
      <input type="checkbox" v-model="organizerOnly" @change="fetchData" />
      Solo miei eventi
    </label>

    <canvas :key="canvasKey" ref="chartCanvas"></canvas>

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
      chart: null,
      organizerOnly: false,
      canvasKey: 0
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
        const res = await axios.get('/organizer/stats/bookings', {
          params: {
            startDate: this.startDate,
            endDate: this.endDate,
            category: this.category,
            organizerOnly: this.organizerOnly
          }
        });
        this.rawData = res.data;
        this.canvasKey++;
        this.$nextTick(() => {
          this.renderChart();
        });
      } catch (error) {
        console.error('Errore nel caricamento dati prenotazioni:', error);
      }
    },
    renderChart() {
      if (this.chart) {
        this.chart.destroy();
      }

      const labels = this.rawData.map(e => e.title);
      const ageGroups = ['0-17', '18-25', '26-35', '36-50', '51+', 'undefined'];
      const colors = ['#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#cccccc'];

      const datasets = ageGroups.map((group, i) => ({
        label: group,
        backgroundColor: colors[i],
        data: this.rawData.map(e => e.ageGroups[group] || 0),
        stack: 'total'
      }));

      const ctx = this.$refs.chartCanvas.getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets
        },
        options: {
          responsive: true,
          scales: {
            x: {
              stacked: true
            },
            y: {
              stacked: true,
              beginAtZero: true
            }
          }
        }
      });
    },
    exportCSV() {
      const rows = [
        ['Evento', 'Data Inizio', 'Data Fine', 'Location', 'Prenotazioni totali', '0-17', '18-25', '26-35', '36-50', '51+', 'undefined']
      ];

      let totalBookings = 0;
      const ageGroups = ['0-17', '18-25', '26-35', '36-50', '51+', 'undefined'];
      const ageGroupTotals = {
        '0-17': 0,
        '18-25': 0,
        '26-35': 0,
        '36-50': 0,
        '51+': 0,
        'undefined': 0
      };

      this.rawData.forEach(e => {
        rows.push([
          e.title,
          new Date(e.startDate).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
          new Date(e.endDate).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
          e.location,
          e.totalBookings,
          e.ageGroups['0-17'],
          e.ageGroups['18-25'],
          e.ageGroups['26-35'],
          e.ageGroups['36-50'],
          e.ageGroups['51+'],
          e.ageGroups['undefined']
        ]);
        totalBookings += e.totalBookings;
        ageGroups.forEach(group => {
          ageGroupTotals[group] += e.ageGroups[group] || 0;
        });
      });

      rows.push([
        'Totale',
        '',
        '',
        '',
        totalBookings,
        ageGroupTotals['0-17'],
        ageGroupTotals['18-25'],
        ageGroupTotals['26-35'],
        ageGroupTotals['36-50'],
        ageGroupTotals['51+'],
        ageGroupTotals['undefined']
      ]);

      const csvContent = rows.map(r => r.join(';')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'prenotazioni_eventi.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
</script>
