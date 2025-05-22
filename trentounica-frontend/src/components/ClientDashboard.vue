<template>
  <div v-for="b in bookings" :key="b._id">
    <h3>{{ b.event.title }}</h3>
    <p>{{ new Date(b.event.date).toLocaleString() }}</p>
    <p>{{ b.event.location.name }}</p>
    <qrcode-vue :value="b._id" :size="100" />
  </div>
</template>

<script>
import axios from '@/api/axios';
import QrcodeVue from 'qrcode.vue';

export default {
  components: { QrcodeVue },
  data() {
    return { bookings: [] };
  },
  async created() {
    const res = await axios.get('/bookings/client', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    this.bookings = res.data;
  }
};
</script>
