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

module.exports = { sendAccountActivationEmail };
