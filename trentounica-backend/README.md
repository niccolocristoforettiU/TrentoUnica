# trentounica-backend

## Project setup
```
npm install
npm install nodemailer
```

### Avvio del server in modalità sviluppo
```
npm run dev
```

> Assicurati che `nodemon` sia installato come dipendenza di sviluppo, o installalo globalmente con:
> ```
> npm install -g nodemon
> ```

### Esecuzione in modalità produzione
```
node src/server.js
```

### Configurazione ambientale
Crea un file `.env` nella root del progetto con le info specificate nel file .env.example:

### Note
- Questo progetto è sviluppato in Node.js con Express.
- L'invio email è gestito tramite `nodemailer`.