const nodemailer = require('nodemailer');
const mdp = require('../../config/mdp');

module.exports = {
    send: send
};

function send(adress, subject, message) {

    return new Promise((resolve, reject) => {

        // création d'un objet transporter réutilisable qui utilise SMTP
        let transporter = nodemailer.createTransport({
            host: 'SSL0.OVH.NET',
            port: 587,
            secure: false, // true pour le port 465, false pour les autres ports
            auth: {
                user: "quimangeou@vivienzo.fr",
                pass: mdp.mail
            }
        });

        // configuration de l'envoie des e-mails
        let mailOptions = {
            from: '"Qui Mange Où" <quimangeou@vivienzo.fr>',
            to: adress, // (peut être une liste)
            subject: subject,
            html: message
        };

        // envoi l'e-mail
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                reject(error);
            }
            resolve(info);
        });
    });

}