<template>
  <div id="app">
    <header>
      <h1>TrentoUnica</h1>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: "App",
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