# TrentoUnica

TrentoUnica è una piattaforma di gestione eventi basata su Vue.js (Frontend) e Express (Backend).

## Struttura del Progetto
```plaintext
TrentoUnica/
├── trentounica-frontend/       --> Cartella del progetto Vue.js (frontend)
│   ├── src/                    --> Codice sorgente del frontend (Vue.js)
│   │   ├── components/         --> Componenti Vue.js
│   │   ├── views/              --> Pagine Vue.js
│   │   ├── router/             --> Configurazione del router Vue.js
│   │   ├── store/              --> Gestione dello stato Vuex (se usato)
│   │   ├── assets/             --> File statici (immagini, stili)
│   │   ├── composables/        --> Funzioni riutilizzabili (Composition API)
│   │   ├── utils/              --> Utility functions (helper functions)
│   │   ├── App.vue             --> Componente principale dell'applicazione
│   │   └── main.js             --> Punto di ingresso principale dell'applicazione
│   ├── public/                 --> File statici (index.html, favicon)
│   ├── package.json            --> Configurazione delle dipendenze del frontend
│   ├── package-lock.json       --> Blocco delle dipendenze del frontend
│   ├── babel.config.js         --> Configurazione di Babel
│   ├── vue.config.js           --> Configurazione del progetto Vue.js
│   ├── jsconfig.json           --> Configurazione degli alias per il codice
│   └── .gitignore              --> File per ignorare node_modules e configurazioni locali
│
├── trentounica-backend/        --> Cartella del progetto Express (backend)
│   ├── src/                    --> Codice sorgente del backend (Express)
│   │   ├── config/             --> Configurazione del database e altre configurazioni
│   │   ├── controllers/        --> Controller per la gestione delle API
│   │   ├── models/             --> Modelli (Mongoose per MongoDB)
│   │   ├── routes/             --> Rotte API (userRoutes, eventRoutes, ecc.)
│   │   ├── middlewares/        --> Middleware (Autenticazione JWT, ecc.)
│   │   ├── services/           --> Servizi di utilità (es. invio email)
│   │   ├── utils/              --> Utility functions (es. routing OSRM)
│   │   └── scripts/            --> Script di utilità per il backend
│   │       └── createAdmin.js  --> Script per creare un utente amministratore in MongoDB
│   ├── index.js                --> File principale del server Express
│   ├── package.json            --> Configurazione delle dipendenze del backend
│   ├── package-lock.json       --> Blocco delle dipendenze del backend
│   ├── .gitignore              --> File per ignorare node_modules e configurazioni locali
│   └── .env.example            --> File di esempio per le variabili d'ambiente
│
├── 1Deriverable.pdf            --> Documento di specifiche del progetto (Parte 1)
├── 2Deriverable.pdf            --> Documento di specifiche del progetto (Parte 2)
├── 3Deriverable.pdf            --> Documento di specifiche del progetto (Parte 3)
├── apiary.apib                 --> Documentazione Apiary
└── README.md                   --> Documentazione del progetto
```

Nota: Il progetto è organizzato in due ambienti distinti:
- Frontend (Vue.js) con dipendenze specifiche nella cartella `trentounica-frontend`.
- Backend (Express) con dipendenze specifiche nella cartella `trentounica-backend`.
