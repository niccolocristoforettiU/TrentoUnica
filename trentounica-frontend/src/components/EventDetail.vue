<template>
  <div v-if="event">
    <h1>{{ event.title }}</h1>
    <p>
      <strong>Luogo:</strong> {{ event.location.name }} -
      <a
        :href="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(event.location.address)"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ event.location.address }}
      </a>
    </p>
    <p><strong>Data:</strong> {{ new Date(event.date).toLocaleString() }}</p>
    <p><strong>Durata:</strong> {{ event.duration }} minuti</p>
    <p><strong>Descrizione:</strong> {{ event.description }}</p>
    <p><strong>Organizzatore:</strong> {{ event.organizer.companyName }} ({{ event.organizer.email }})</p>
    <p><strong>Prezzo:</strong> €{{ event.price }}</p>
    <p v-if="event.ageRestricted"><strong>Età minima:</strong> {{ event.minAge }} anni</p>
    <p><strong>Popolarità:</strong> {{ event.popularity }}</p>
    <p v-if="event.ageRestricted"><strong>Età minima:</strong> {{ event.minAge }} anni</p>

    <!-- Preferenza evento -->
    <div v-if="((userRole === 'client' && !hasBooking) || isGuest) && !isPastEvent">
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

    <div v-if="event.bookingRequired && (userRole === 'client' || isGuest)">
      <p v-if="isGuest" class="text-info">
        Per prenotare questo evento è necessaria la registrazione.
      </p>
      <p v-if="userRole === 'client' && event.ageRestricted && !isPastEvent && !hasBooking && userAge !== null && userAge < event.minAge" class="text-danger">
        Non puoi prenotare questo evento: età minima richiesta {{ event.minAge }} anni.
      </p>
      <p v-else-if="userRole === 'client' && event.bookingCount >= event.location.maxSeats" class="text-danger">
        Evento sold out 🚫
      </p>

      <!-- Prenotazione gratuita -->
      <button
        v-else-if="!hasBooking && event.price === 0 && !isPastEvent && userRole === 'client'"
        @click="prenotaEvento"
        class="btn btn-primary"
      >
        Prenotazione gratuita
      </button>
      <!-- Prenotazione con pagamento PayPal -->
      <template v-else-if="!hasBooking && event.price > 0 && !isPastEvent && userRole === 'client'">
        <p class="text-info">
          Utilizza uno dei metodi di pagamento qui sotto per effettuare la prenotazione:
        </p>
        <div class="paypal-wrapper">
          <div id="paypal-button-container" ref="paypal"></div>
        </div>
      </template>
      <p v-else-if="hasBooking && userRole === 'client'" class="text-success">
        Prenotazione già effettuata ✔️
      </p>

      <!-- Mostra biglietto se disponibile -->
      <div v-if="ticket" class="ticket-popup">
        <h3>Biglietto per {{ ticket.title }}</h3>
        <p>{{ new Date(ticket.date).toLocaleString() }}</p>
        <p>
          {{ ticket.location.name }} -
          <a
            :href="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ticket.location.address)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ ticket.location.address }}
          </a>
        </p>
        <qrcode-vue :value="ticket.qrCodeData" :size="150" />
      </div>


      <div v-if="tratte.length > 0 && userRole === 'client' && !isPastEvent">
        <h3 v-if="!trattaPrenotata">Tratte disponibili per questo evento:</h3>
      <div v-if="trattaPrenotata" class="ticket-popup">
        <p class="text-success mt-2">Tratta già prenotata ✔️</p>
        <h3>Biglietto tratta per {{ event.title }}</h3>
        <p>{{ new Date(trattaPrenotata.departureTime).toLocaleString() }}</p>
        <p>
          <a
            :href="trattaPrenotata.mapsLink"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ trattaPrenotata.mapsAddress }}
          </a>
        </p>
        <qrcode-vue :value="trattaPrenotata._id" :size="150" />
      </div>
      <div v-else>
        <div v-for="tratta in tratte" :key="tratta._id" class="mb-2">
          <p>
            Partenza: {{ new Date(tratta.departureTime).toLocaleTimeString() }},
            Posti disponibili: {{ tratta.capacity - tratta.bookingCount }}
            Fermata:
            <a
              v-if="tratta.mapsLink"
              :href="tratta.mapsLink"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ tratta.mapsAddress }}
            </a>
            <span v-else>
              {{ tratta.midpoint.lat.toFixed(4) }}, {{ tratta.midpoint.lon.toFixed(4) }}
            </span>
          </p>
          <button
            class="btn btn-outline-primary"
            @click="prenotaTratta(tratta._id)"
            :disabled="tratta.bookingCount >= tratta.capacity"
          >
            Prenota questa tratta
          </button>
        </div>
      </div>
      </div>
    </div>

    <p v-if="isPastEvent" class="text-muted">
      Evento concluso
    </p>

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
      hasLocationPreferred: false,
      userAge: null,
      isGuest: !!localStorage.getItem("guestId") && !localStorage.getItem("token"),
      guestId: localStorage.getItem("guestId") || null,
      tratte:[],
      trattaPrenotata: null,
    };
  },
  computed: {
    isPastEvent() {
      return this.event ? new Date(this.event.date) < new Date() : false;
    }
  },
  async created() {
    try {
      const id = this.$route.params.id;
      const response = await axios.get(`/events/${id}`);
      this.event = response.data;
      await this.checkTrattaPrenotata();

      if (this.userRole === "client") {
        this.getUserAge();
        this.$nextTick(async () => {
          await this.checkBooking();
          await this.checkLocationPreference();
        });
      }

      this.$nextTick(async () => {
        await this.checkPreference();
      });

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
      await this.fetchTratteAttive();
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
      if (this.isPastEvent) {
        alert("Non è possibile prenotare un evento già passato.");
        return;
      }
      try {
        const bookingRes = await axios.post(
          "/bookings",
          { eventId: this.event._id },
          { headers: { Authorization: `Bearer ${this.token}` } }
        );

        //Update event popularity from backend response
        if (bookingRes.data.event) {
          this.event = bookingRes.data.event;
        }

        //Then fetch the ticket
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

        if (res.data.hasBooking && new Date(this.event.date) >= new Date()) {
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
      //Se l'evento non richiede prenotazione o è già stato prenotato, non fare nulla
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
      const waitForContainer = () => {
        const container = document.getElementById("paypal-button-container");
        if (!container) {
          setTimeout(waitForContainer, 100);
        } else {
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
      };

      waitForContainer();
    },
    async checkPreference() {
      try {
        const headers = this.token
          ? { Authorization: `Bearer ${this.token}` }
          : this.guestId
            ? { "x-guest-id": this.guestId }
            : {};

        const res = await axios.get(`/preferences/${this.event._id}`, { headers });

        this.hasPreferred = res.data.hasPreference === true;
      } catch (err) {
        console.error("Errore nel checkPreference:", err);
        this.hasPreferred = false;
      }
    },
    async togglePreference() {
      if (this.isPastEvent) {
        alert("Non è possibile aggiungere un evento passato ai preferiti.");
        return;
      }
      try {
        const headers = this.token
          ? { Authorization: `Bearer ${this.token}` }
          : this.guestId
            ? { "x-guest-id": this.guestId }
            : {};

        if (this.hasPreferred) {
          await axios.delete(`/events/${this.event._id}/preference`, { headers });
          this.hasPreferred = false;
          this.event.popularity--;
        } else {
          await axios.post(`/events/${this.event._id}/preference`, {}, { headers });
          this.hasPreferred = true;

          const updatedEvent = await axios.get(`/events/${this.event._id}`);
          this.event = updatedEvent.data;
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
    },
    async getUserAge() {
      try {
        const res = await axios.get('/users/profile', {
          headers: { Authorization: `Bearer ${this.token}` }
        });
        const birthDate = new Date(res.data.birthDate);
        const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        this.userAge = age;
      } catch (err) {
        console.error("Errore nel recupero età utente:", err);
        this.userAge = null;
      }
    },
    async fetchTratteAttive() {
      try {
        const res = await axios.get(`/tratte/event/${this.event._id}`, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        const tratteWithAddress = await Promise.all(
          res.data.map(async tratta => {
            try {
              const addrRes = await axios.get(`/tratte/reverse-geocode`, {
                params: {
                  lat: tratta.midpoint.lat,
                  lon: tratta.midpoint.lon
                },
                headers: {
                  Authorization: `Bearer ${this.token}`
                }
              });
              tratta.mapsAddress = addrRes.data.address;
              tratta.mapsLink = addrRes.data.mapsUrl;
            } catch (error) {
              console.warn('Errore nel recupero indirizzo tratta:', error);
              tratta.mapsAddress = null;
              tratta.mapsLink = null;
            }
            return tratta;
          })
        );
        
        this.tratte = tratteWithAddress;
      } catch (err) {
        console.error('Errore nel recupero tratte:', err);
      }
    },
    async prenotaTratta(trattaId) {
      try {
        console.log("Invio trattaId:", trattaId);
        await axios.post(`/trattabookings`, {
          trattaId
        }, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        alert("Prenotazione della tratta completata ✅");
        await this.fetchTratteAttive(); // aggiorna conteggio posti
        await this.checkTrattaPrenotata();  
      } catch (err) {
        console.error("Errore nella prenotazione tratta:", err);
        alert("Errore nella prenotazione della tratta.");
      }
    },
    async checkTrattaPrenotata() {
      try {
        if (!this.token || this.userRole !== "client") return;

        const res = await axios.get('/trattabookings/client', {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        const matching = res.data.find(tb => tb.tratta?.event?._id === this.event._id);

        if (matching) {
          const tratta = matching.tratta;

          // Se non ha già indirizzo, chiamata al reverse-geocode
          if (!tratta.mapsAddress) {
            try {
              const addrRes = await axios.get(`/tratte/reverse-geocode`, {
                params: {
                  lat: tratta.midpoint.lat,
                  lon: tratta.midpoint.lon
                },
                headers: {
                  Authorization: `Bearer ${this.token}`
                }
              });

              tratta.mapsAddress = addrRes.data.address;
              tratta.mapsLink = addrRes.data.mapsUrl;
            } catch (error) {
              console.warn("Errore nel reverse geocode tratta prenotata:", error);
              tratta.mapsAddress = null;
              tratta.mapsLink = null;
            }
          }

          this.trattaPrenotata = tratta;
        } else {
          this.trattaPrenotata = null;
        }
      } catch (err) {
        console.error("Errore nel checkTrattaPrenotata:", err);
        this.trattaPrenotata = null;
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
  .day-has-event::after {
    content: '';
    display: block;
    margin: 0 auto;
    width: 6px;
    height: 6px;
    background-color: #28a745;
    border-radius: 50%;
    margin-top: 4px;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 24px;
  }
  .switch input {
    display: none;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  input:checked + .slider {
    background-color: #28a745;
  }
  input:checked + .slider:before {
    transform: translateX(16px);
  }
</style>