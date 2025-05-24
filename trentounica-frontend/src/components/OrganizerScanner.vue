<template>
  <div class="scanner-wrapper">
    <h2>Scansione QR Code</h2>

    <qrcode-stream @decode="onDecode" @init="onInit" :paused="!!scanResult"/>
    <p style="color:blue; font-weight:bold;">Scanner caricato</p>
    <div v-if="scanResult" class="result">
      <p v-if="scanResult.valid" class="success">✅ {{ scanResult.message }}</p>
      <p v-else class="error">❌ {{ scanResult.reason }}</p>
    </div>
  </div>
</template>

<script>
import { QrcodeStream } from 'vue-qrcode-reader';

export default {
  name: 'OrganizerScanner',
  props: {
    eventId: {
      type: String,
      required: true
    }
  },
  components: { QrcodeStream },
  data() {
    return {
      scanResult: null
    };
  },
  methods: {
    onInit(promise) {
    console.log('onInit chiamato');
      promise
        .then(() => console.log('🎥 Fotocamera attiva'))
        .catch(error => {
          console.error('❌ Errore accesso camera:', error);
          alert('Errore accesso fotocamera');
        });
    },
    onDecode(decodedText) {
        console.log('✅ QR letto:', decodedText);
        alert(`QR letto: ${decodedText}`);
        this.validateTicket(decodedText);

        // Disattiva lo scanner per 3 secondi, poi riattivalo
        setTimeout(() => {
            console.log('♻️ Scanner riattivato');
            this.scanResult = null; // questo riattiva il qrcode-stream perché paused = false
        }, 3000);
    },
    async validateTicket(ticketId) {
      const token = localStorage.getItem('token');

      try {
        const response = await fetch('http://localhost:5050/api/bookings/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ ticketId, eventId: this.eventId })
        });

        const result = await response.json();
        this.scanResult = result;
        console.log('🎟️ Risultato validazione:', result);
      } catch (err) {
        console.error('❌ Errore durante la validazione:', err);
        this.scanResult = { valid: false, reason: 'Errore di rete o server.' };
      }
    }
  }
};
</script>


<style scoped>
.scanner-wrapper {
  padding: 20px;
  text-align: center;
}

.result {
  margin-top: 20px;
  font-size: 1.2rem;
}

.success {
  color: green;
}

.error {
  color: red;
}

qrcode-stream {
  border: 2px dashed #2e7d32;
  width: 100%;
  max-width: 400px;
  margin: auto;
  display: block;
}
</style>

