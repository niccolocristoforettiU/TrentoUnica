# TrentoUnica

TrentoUnica è una piattaforma di gestione eventi basata su Vue.js (Frontend) e Express (Backend).

## Struttura del Progetto
```plaintext
TrentoUnica/
├── trentounica-frontend/       --> Cartella del progetto Vue.js (frontend)
│   ├── src/                    --> Codice sorgente del frontend (Vue.js)
│   ├── public/                 --> File statici (index.html, favicon)
│   ├── package.json            --> Configurazione delle dipendenze del frontend
│   └── .gitignore              --> File per ignorare node_modules e configurazioni locali
│
├── trentounica-backend/        --> Cartella del progetto Express (backend)
│   ├── src/                    --> Codice sorgente del backend (Express)
│   │   ├── config/             --> Configurazione del database e altre configurazioni
│   │   ├── controllers/        --> Controller per la gestione delle API
│   │   ├── models/             --> Modelli (Mongoose per MongoDB)
│   │   ├── routes/             --> Rotte API (userRoutes, eventRoutes, ecc.)
│   │   └── middlewares/        --> Middleware (Autenticazione JWT, ecc.)
│   ├── package.json            --> Configurazione delle dipendenze del backend
│   ├── .gitignore              --> File per ignorare node_modules e configurazioni locali
│   └── .env                    --> Variabili d'ambiente
│
├── 1Deriverable.pdf            --> Documento di specifiche del progetto (Parte 1)
├── 2Deriverable.pdf            --> Documento di specifiche del progetto (Parte 2)
└── README.md                   --> Documentazione del progetto