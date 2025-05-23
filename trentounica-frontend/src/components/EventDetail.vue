<template>
  <div v-if="event">
    <h1>{{ event.title }}</h1>
    <p><strong>Luogo:</strong> {{ event.location.name }} - {{ event.location.address }}</p>
    <p><strong>Data:</strong> {{ new Date(event.date).toLocaleString() }}</p>
    <p><strong>Durata:</strong> {{ event.duration }} ore</p>
    <p><strong>Descrizione:</strong> {{ event.description }}</p>
    <p><strong>Organizzatore:</strong> {{ event.organizer.companyName }} ({{ event.organizer.email }})</p>
    <p><strong>Prezzo:</strong> €{{ event.price }}</p>
    <p><strong>Popolarità:</strong> {{ event.popolarity }}</p>

    <div v-if="event.bookingRequired && userRole === 'client'">
      <p v-if="event.bookingCount >= event.location.maxSeats" class="text-danger">
        Evento sold out 🚫
      </p>

      <!-- Prenotazione gratuita -->
      <button
        v-else-if="!hasBooking && event.price === 0"
        @click="prenotaEvento"
        class="btn btn-primary"
      >
        Prenotazione gratuita
      </button>

      <!-- Prenotazione con pagamento PayPal -->
      <div v-else-if="!hasBooking && event.price > 0" class="paypal-wrapper">
        <div id="paypal-button-container" ref="paypal"></div>
      </div>

      <p v-else class="text-success">
        Prenotazione già effettuata ✔️
      </p>
    </div>

    <!-- Mostra biglietto se disponibile -->
    <div v-if="ticket" class="ticket-popup">
      <h3>Biglietto per {{ ticket.title }}</h3>
      <p>{{ new Date(ticket.date).toLocaleString() }}</p>
      <p>{{ ticket.location.name }} - {{ ticket.location.address }}</p>
      <qrcode-vue :value="ticket.qrCodeData" :size="150" />
    </div>
  </div>
  <div v-else>
    <p>Caricamento evento in corso...</p>
  </div>
</template>

<script>
import axios from "@/api/axios";
import QrcodeVue from "qrcode.vue";

export default {
  name: "EventDetail",
  components: { QrcodeVue },
  data() {
    return {
      event: null,
      ticket: null,
      hasBooking: false,
      userRole: localStorage.getItem("role"),
      token: localStorage.getItem("token"),
      paypalRendered: false
    };
  },
  async created() {
    try {
      const id = this.$route.params.id;
      const response = await axios.get(`/events/${id}`);
      this.event = response.data;

      if (this.token && this.userRole === "client") {
        await this.checkBooking();
      }

      this.$nextTick(() => {
        if (
          this.event &&
          this.event.price > 0 &&
          !this.hasBooking &&
          this.userRole === "client"
        ) {
          this.loadPayPal();
        }
      });
    } catch (error) {
      console.error("Errore durante il recupero dell'evento:", error);
    }
  },
  watch: {
    event(newEvent) {
      if (
        newEvent &&
        newEvent.price > 0 &&
        !this.hasBooking &&
        this.userRole === "client"
      ) {
        this.loadPayPal();
      }
    }
  },
  methods: {
    async prenotaEvento() {
      try {
        await axios.post(
          "/bookings",
          { eventId: this.event._id },
          { headers: { Authorization: `Bearer ${this.token}` } }
        );

        const response = await axios.get(`/bookings/ticket/${this.event._id}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        this.ticket = response.data.ticket;
        this.hasBooking = true;
      } catch (err) {
        console.error(err);
        alert("Prenotazione non disponibile o già effettuata.");
      }
    },
    async checkBooking() {
      try {
        const res = await axios.get(`/bookings/ticket/${this.event._id}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        this.hasBooking = true;
        this.ticket = res.data.ticket;
      } catch (err) {
        if (err.response?.status === 403) {
          this.hasBooking = false;
        } else {
          console.error("Errore nel checkBooking:", err);
        }
      }
    },
    loadPayPal() {
      if (this.paypalRendered) return;

      if (document.getElementById("paypal-sdk")) {
        this.waitForPayPal().then(() => this.renderPayPalButton());
        return;
      }

      const script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src = "https://www.paypal.com/sdk/js?client-id=AZXVkMtJjKTH-NJnMNWWQMzK_6TugZCnqejTzHyYsFY3QdiGJP6IR30RvM3Lp2ES3sQGlrPmzN_V7no5&currency=EUR";
      script.onload = () => {
        this.waitForPayPal().then(() => this.renderPayPalButton());
      };
      document.head.appendChild(script);
    },
    waitForPayPal() {
      return new Promise((resolve) => {
        const check = () => {
          if (window.paypal && window.paypal.Buttons) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    },
    renderPayPalButton() {
      if (this.paypalRendered) return;
      this.paypalRendered = true;

      window.paypal.Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: this.event.price.toFixed(2)
                }
              }
            ]
          });
        },
        onApprove: async (data, actions) => {
          const details = await actions.order.capture();
          console.log("Pagamento completato:", details);
          await this.prenotaEvento();
        },
        onError: (err) => {
          console.error("Errore PayPal:", err);
          alert("Errore durante il pagamento.");
        }
      }).render("#paypal-button-container");
    }
  }
};
</script>

<style scoped>
h1 {
  margin-bottom: 1rem;
}

p {
  margin: 0.5rem 0;
}

.paypal-wrapper {
  display: flex !important;
  justify-content: center !important;
  margin-top: 1rem;
  width: 100%;
}

#paypal-button-container {
  width: 100%;
  max-width: 600px;
}
</style>