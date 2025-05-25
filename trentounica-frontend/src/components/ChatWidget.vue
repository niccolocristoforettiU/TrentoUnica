<template>
  <div class="chat-widget">
    <button class="chat-toggle" @click="isOpen = !isOpen">
      💬 AI
    </button>

    <div v-if="isOpen" class="chat-box">
      <div class="chat-header">Assistente Virtuale</div>

      <div class="chat-messages">
        <div v-for="(msg, index) in messages" :key="index" :class="msg.role">
          {{ msg.content }}
        </div>
      </div>

      <form @submit.prevent="sendMessage">
        <input v-model="input" type="text" placeholder="Scrivi qui..." />
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const isOpen = ref(false)
const input = ref('')
const messages = ref([
  { role: 'assistant', content: 'Ciao! Come posso aiutarti oggi?' }
])

const sendMessage = async () => {
  if (!input.value.trim()) return
  messages.value.push({ role: 'user', content: input.value })

  try {
    const res = await axios.post('/api/chat', {
        messages: messages.value
    })

    const reply = res.data
    messages.value.push(reply)
    input.value = ''
  } catch (err) {
    messages.value.push({ role: 'assistant', content: 'Errore durante la risposta.' })
  }
}
</script>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  font-family: sans-serif;
}
.chat-toggle {
  background-color: #2e7d32;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
}
.chat-box {
  width: 300px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  margin-top: 10px;
  display: flex;
  flex-direction: column;
}
.chat-header {
  background: #2e7d32;
  color: white;
  padding: 10px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  font-weight: bold;
}
.chat-messages {
  padding: 10px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 14px;
}
.user {
  text-align: right;
  margin-bottom: 8px;
}
.assistant {
  text-align: left;
  margin-bottom: 8px;
}
form {
  display: flex;
  border-top: 1px solid #ccc;
}
input {
  flex: 1;
  padding: 10px;
  border: none;
  font-size: 14px;
}
input:focus {
  outline: none;
}
</style>
