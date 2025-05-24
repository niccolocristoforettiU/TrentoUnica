<template>
  <div v-if="event">
    <h1>{{ event.title }}</h1>
    <p><strong>Luogo:</strong> {{ event.location.name }} - {{ event.location.address }}</p>
    <p><strong>Data:</strong> {{ new Date(event.date).toLocaleString() }}</p>
    <p><strong>Durata:</strong> {{ event.duration }} minuti</p>
    <p><strong>Descrizione:</strong> {{ event.description }}</p>
    <p><strong>Organizzatore:</strong> {{ event.organizer.companyName }} ({{ event.organizer.email }})</p>
    <p><strong>Prezzo:</strong> €{{ event.price }}</p>
    <p><strong>Popolarità:</strong> {{ event.popularity }}</p>

    <!-- Preferenza evento -->
    <div v-if="userRole === 'client' && !hasBooking">
      <button @click="togglePreference" class="btn" :class="hasPreferred ? 'btn-secondary' : 'btn-outline-secondary'">
        {{ hasPreferred ? 'Rimuovi preferenza' : 'Mi interessa questo evento' }}
      </button>
    </div>

    <!-- Preferenza location -->
    <div v-if="userRole === 'client' && event.location">
      <button @click="toggleLocationPreference" class="btn" :class="hasLocationPreferred ? 'btn-success' : 'btn-outline-success'">
        {{ hasLocationPreferred ? 'Rimuovi location dai preferiti' : 'Aggiungi location ai preferiti' }}
      </button>
    </div>

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
      <template v-else-if="!hasBooking && event.price > 0">
        <p class="text-info">
          Utilizza uno dei metodi di pagamento qui sotto per effettuare la prenotazione:
        </p>
        <div class="paypal-wrapper">
          <div id="paypal-button-container" ref="paypal"></div>
        </div>
      </template>

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
      paypalRendered: false,
      hasPreferred: false,
      hasLocationPreferred: false
    };
  },
  async created() {
    try {
      const id = this.$route.params.id;
      const response = await axios.get(`/events/${id}`);
      this.event = response.data;

      if (this.token && this.userRole === "client") {
        await this.checkBooking();
        await this.checkPreference();
        await this.checkLocationPreference();
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
        if (!this.token || this.userRole !== "client") return;

        const res = await axios.get(`/bookings/ticket/${this.event._id}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        if (res.data.hasBooking) {
          this.hasBooking = true;
          this.ticket = res.data.ticket;
        } else {
          this.hasBooking = false;
          this.ticket = null;
        }
      } catch (err) {
        console.error("Errore nel checkBooking:", err);
        this.hasBooking = false;
        this.ticket = null;
      }
    },
    loadPayPal() {
      // ✅ Se l'evento non richiede prenotazione o è già stato prenotato, non fare nulla
      if (
        !this.event ||
        !this.event.bookingRequired || 
        this.hasBooking || 
        this.userRole !== "client" || 
        this.paypalRendered
      ) {
        return;
      }

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
    },
    async checkPreference() {
      try {
        if (!this.token || this.userRole !== "client") return;

        const res = await axios.get(`/preferences/${this.event._id}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        this.hasPreferred = res.data.hasPreference === true;
      } catch (err) {
        console.error("Errore nel checkPreference:", err);
        this.hasPreferred = false;
      }
    },
    async togglePreference() {
      try {
        if (this.hasPreferred) {
          await axios.delete(`/events/${this.event._id}/preference`, {
            headers: { Authorization: `Bearer ${this.token}` }
          });
          this.hasPreferred = false;
          this.event.popularity--;
        } else {
          await axios.post(`/events/${this.event._id}/preference`, {}, {
            headers: { Authorization: `Bearer ${this.token}` }
          });
          this.hasPreferred = true;
          this.event.popularity++;
        }
      } catch (error) {
        console.error("Errore nella gestione preferenza:", error);
      }
    },
    async checkLocationPreference() {
      try {
        if (!this.token || this.userRole !== "client" || !this.event?.location?._id) return;

        const res = await axios.get(`/users/profile`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        const preferredLocations = res.data.preferredLocations || [];
        this.hasLocationPreferred = preferredLocations.includes(this.event.location._id);
      } catch (err) {
        console.error("Errore nel checkLocationPreference:", err);
        this.hasLocationPreferred = false;
      }
    },

    async toggleLocationPreference() {
      try {
        const locationId = this.event.location._id;
        if (this.hasLocationPreferred) {
          await axios.delete(`/locations/${locationId}/preference`, {
            headers: { Authorization: `Bearer ${this.token}` }
          });
          this.hasLocationPreferred = false;
        } else {
          await axios.post(`/locations/${locationId}/preference`, {}, {
            headers: { Authorization: `Bearer ${this.token}` }
          });
          this.hasLocationPreferred = true;
        }
      } catch (error) {
        console.error("Errore nella gestione preferenza location:", error);
      }
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