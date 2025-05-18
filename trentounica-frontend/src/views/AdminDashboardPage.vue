<template>
  <div>
    <AdminDashboard />
  </div>
</template>

<script>
import AdminDashboard from "../components/AdminDashboard.vue";

export default {
  name: "AdminDashboardPage",
  components: {
    AdminDashboard
  }
};
</script>

<style scoped>
div {
  padding: 20px;
}
</style>
