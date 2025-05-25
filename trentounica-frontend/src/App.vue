<template>
  <div id="app">
    <main>
      <router-view />
    </main>
    <ChatWidget v-if="isAuthenticated" />
  </div>
</template>

<script>
import ChatWidget from '@/components/ChatWidget.vue';

export default {
  name: "App",
  components: { ChatWidget },
  data() {
    return {
      isAuthenticated: !!localStorage.getItem('token')
    };
  },
  created() {
    window.addEventListener('storage', this.checkAuth);
    window.addEventListener('token-updated', this.checkAuth); // evento custom
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.checkAuth);
    window.removeEventListener('token-updated', this.checkAuth);
  },
  methods: {
    checkAuth() {
      this.isAuthenticated = !!localStorage.getItem('token');
    }
  }
};
</script>


<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}
header {
  background-color: #42b983;
  color: white;
  padding: 15px 0;
}
main {
  padding: 20px;
}
</style>