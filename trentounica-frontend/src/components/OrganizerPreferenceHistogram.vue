<template>
  <div>
    <h2>Preferenze Eventi (per età)</h2>

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
      isRendering: false,
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
      if (this.isRendering) return;
      this.isRendering = true;
      try {
        const res = await axios.get('/organizer/stats/preferences', {
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
          this.isRendering = false;
        });
      } catch (error) {
        console.error('Errore nel caricamento dati preferenze:', error);
        this.isRendering = false;
      }
    },
    renderChart() {
      const ctx = this.$refs.chartCanvas?.getContext('2d');
      if (!ctx) return;

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
      // Updated header as requested
      const rows = [
        ['Evento', 'Data Inizio', 'Data Fine', 'Location', 'Preferenze totali', '0-17', '18-25', '26-35', '36-50', '51+', 'undefined']
      ];

      // Add event rows with formatted dates and total preferences
      this.rawData.forEach(e => {
        const total = Object.values(e.ageGroups).reduce((sum, val) => sum + val, 0);
        rows.push([
          e.title,
          new Date(e.startDate).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
          new Date(e.endDate).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
          e.location,
          total,
          e.ageGroups['0-17'],
          e.ageGroups['18-25'],
          e.ageGroups['26-35'],
          e.ageGroups['36-50'],
          e.ageGroups['51+'],
          e.ageGroups['undefined']
        ]);
      });

      // Calculate totals per age group and grand total
      const finalTotals = {
        '0-17': 0, '18-25': 0, '26-35': 0, '36-50': 0, '51+': 0, 'undefined': 0
      };
      this.rawData.forEach(e => {
        Object.keys(finalTotals).forEach(k => {
          finalTotals[k] += e.ageGroups[k];
        });
      });
      const grandTotal = Object.values(finalTotals).reduce((a, b) => a + b, 0);
      rows.push([
        'Totale', '', '', '', grandTotal,
        finalTotals['0-17'],
        finalTotals['18-25'],
        finalTotals['26-35'],
        finalTotals['36-50'],
        finalTotals['51+'],
        finalTotals['undefined']
      ]);

      const csvContent = rows.map(r => r.join(';')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'preferenze_eventi.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
</script>
