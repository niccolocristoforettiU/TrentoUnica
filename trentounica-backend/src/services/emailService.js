// src/services/emailService.js
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const GMAIL_USER = process.env.GMAIL_USER;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendAccountActivationEmail(to, name) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: GMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        const mailOptions = {
            from: `TrentoUnica <${GMAIL_USER}>`,
            to: to,
            subject: 'Attivazione del tuo account su TrentoUnica',
            html: `
                <h1>Benvenuto su TrentoUnica, ${name}!</h1>
                <p>Il tuo account è stato verificato ed è ora attivo. Puoi accedere al tuo profilo e iniziare a organizzare eventi sulla nostra piattaforma.</p>
                <p>Grazie per aver scelto TrentoUnica!</p>
                <p>Saluti,<br>Il team di TrentoUnica</p>
            `,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`Email inviata con successo a ${to}`);
        return result;
    } catch (error) {
        console.error("Errore durante l'invio dell'email:", error);
        throw error;
    }
}

async function sendPasswordResetEmail(to, token) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: GMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        const resetLink = `http://localhost:8080/reset-password/${token}`; // Cambia con URL reale se necessario

        const mailOptions = {
            from: `TrentoUnica <${GMAIL_USER}>`,
            to: to,
            subject: 'Reimposta la tua password su TrentoUnica',
            html: `
                <h2>Richiesta di reimpostazione password</h2>
                <p>Abbiamo ricevuto una richiesta per reimpostare la tua password. Clicca il link qui sotto per sceglierne una nuova:</p>
                <a href="${resetLink}" target="_blank">${resetLink}</a>
                <p>Il link sarà valido per 1 ora.</p>
                <p>Se non hai richiesto nulla, ignora questo messaggio.</p>
                <br>
                <p>Il team di TrentoUnica</p>
            `,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`Email reset password inviata a ${to}`);
        return result;
    } catch (error) {
        console.error("Errore durante l'invio dell'email di reset:", error);
        throw error;
    }
}

async function sendEventCancellationEmail(to, name, eventTitle) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: GMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        const mailOptions = {
            from: `TrentoUnica <${GMAIL_USER}>`,
            to: to,
            subject: `Evento "${eventTitle}" cancellato`,
            html: `
                <h2>Ciao ${name || 'utente'},</h2>
                <p>Ti informiamo che l'evento <strong>"${eventTitle}"</strong>, al quale ti eri prenotato o che avevi aggiunto ai preferiti, è stato cancellato.</p>
                <p>Ci scusiamo per il disagio.</p>
                <p>Il team di TrentoUnica</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email di cancellazione evento inviata a ${to}`);
    } catch (error) {
        console.error("Errore durante l'invio dell'email di cancellazione evento:", error);
    }
}

async function sendEventNotificationForLocation(to, name, eventTitle, locationName, eventDate) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: GMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        const mailOptions = {
            from: `TrentoUnica <${GMAIL_USER}>`,
            to,
            subject: `Nuovo evento a ${locationName}!`,
            html: `
                <h2>Ciao ${name || 'utente'}!</h2>
                <p>Hai espresso una preferenza per la location <strong>${locationName}</strong>.</p>
                <p>È stato appena creato un nuovo evento: <strong>${eventTitle}</strong></p>
                <p><strong>Data evento:</strong> ${new Date(eventDate).toLocaleString()}</p>
                <p>Dai un’occhiata su TrentoUnica per maggiori dettagli!</p>
                <br>
                <p>Il team di TrentoUnica</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Notifica evento inviata a ${to}`);
    } catch (error) {
        console.error("Errore invio email nuovo evento per location:", error);
    }
}

async function sendTrattaAvailableEmailToUser(to, name, eventTitle, trattaDate, trattaDeparture, trattaMidpoint) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: GMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        const mailOptions = {
            from: `TrentoUnica <${GMAIL_USER}>`,
            to,
            subject: `È disponibile una tratta per l’evento "${eventTitle}"!`,
            html: `
                <h2>Ciao ${name || 'utente'}!</h2>
                <p>Abbiamo una buona notizia: ora c'è una tratta disponibile per raggiungere l'evento <strong>${eventTitle}</strong> a cui sei interessato.</p>
                <ul>
                    <li><strong>Data:</strong> ${new Date(trattaDate).toLocaleString()}</li>
                    <li><strong>Punto di partenza:</strong> ${trattaDeparture}</li>
                    <li><strong>Punto intermedio:</strong> ${trattaMidpoint || 'Non specificato'}</li>
                </ul>
                <p>Vai sulla piattaforma per prenotare il tuo posto!</p>
                <br>
                <p>Il team di TrentoUnica</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email di tratta disponibile inviata a ${to}`);
    } catch (error) {
        console.error("Errore invio email tratta disponibile:", error);
    }
}





module.exports = { sendAccountActivationEmail, sendPasswordResetEmail, sendEventCancellationEmail, sendEventNotificationForLocation, sendTrattaAvailableEmailToUser };
