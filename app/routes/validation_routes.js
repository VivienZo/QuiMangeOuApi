const moment = require('moment');
const Validation = require('../models/validation');
const Groupe = require('../models/groupe');
const Util = require('../services/util');
const Email = require('../services/email');

module.exports = (app, router) => {

    // routes qui finissent par /validations/:token
    // ----------------------------------------------------
    router.route('/validations')

        // création d'une Validation
        .post((req, res) => {
            try {

                // vérification des données d'entrée
                if (!req.body.email || typeof req.body.email !== 'string' || req.body.email.length > 50 ||
                    !req.body.nomGroupe || typeof req.body.nomGroupe !== 'string' || req.body.nomGroupe.length > 50) {
                    res.status(500)
                        .json({
                            status: 500,
                            error: req.body,
                            message: "Données d'entrée incorrectes."
                        });
                    return;
                }

                // suppression de la validation existante (s'il y en a une) pour cet e-mail et ce nom de groupe
                Validation.remove({
                    'email': req.body.email.toLowerCase(),
                    'nomGroupe': req.body.nomGroupe
                }, (err) => {
                    if (err) {
                        res.status(500)
                            .json({
                                status: 500,
                                error: err,
                                message: "Erreur lors de la suppression de l'ancienne validation."
                            });
                        return;
                    }
                });

                // recherche si un groupe avec cet e-mail existe déjà
                Groupe.findOne({
                    'email': req.body.email.toLowerCase(),
                    'nom': req.body.nomGroupe
                }, (err, groupe) => {
                    if (err) {
                        res.status(500)
                            .json({
                                status: 500,
                                error: err,
                                message: "Erreur lors de la recherche d'un groupe correspondant à la validation."
                            });
                        return;
                    }
                    if (groupe) {

                        // envoie d'un e-mail de rappel avec les informations du groupe
                        sendRappelGroupeEmailCallback(groupe);
                    } else {

                        // création d'une nouvelle validation
                        Validation.create({
                            email: req.body.email.toLowerCase(),
                            nomGroupe: req.body.nomGroupe,
                            token: Util.generateToken()
                        }).then((validation) => {
                            if (validation.errors) {
                                res.status(500)
                                    .json({
                                        status: 500,
                                        error: validation.errors,
                                        message: "Erreur lors de la création de la validation."
                                    });
                                return;
                            }

                            // envoie d'un e-mail permettant de valider l'adresse e-mail du groupe
                            sendValidationEmailCallback(validation._doc);
                        });

                    }
                });

                function sendValidationEmailCallback(validation) {

                    const titre = 'Activation de votre Groupe';
                    const message = '<h2>Bienvenue sur Qui Mange Où !</h2>' +
                        '<p>' +
                        'Cliquez sur le lien suivant pour valider la création de votre groupe :<br /><br />' +
                        '<a href="' + Util.getAppUrl() + 'validations/' + validation.token + '" ' +
                        'rel="Valider mon groupe">' + Util.getAppUrl() + 'validations/' + validation.token + '</a>' +
                        '<br /></p>' +
                        '<p>Ce lien est valide pendant 24h.</p>' +
                        '<h4>Vivien de Qui Mange Où</h4>';

                    // envoie de l'email d'activation du groupe
                    let responsePromise = Email.send(validation.email, titre, message);
                    responsePromise.then(
                        (value) => {
                            // envoie de la réponse à la requête
                            res.status(201)
                                .json({
                                    status: 201,
                                    data: {
                                        nomGroupe: validation.nomGroupe,
                                        email: validation.email
                                    },
                                    message: 'Validation créée.'
                                });
                            return;
                        },
                        (reason) => {
                            res.status(500)
                                .json({
                                    status: 500,
                                    error: reason,
                                    message: "Erreur lors de l'envoie de l'e-mail de validation du groupe."
                                });
                            return;
                        }
                    );

                }

                function sendRappelGroupeEmailCallback(groupe) {

                    const titre = 'Rappel des informations de votre Groupe';
                    const message = '<h2>Rappel des informations de votre Groupe sur Qui Mange Où !</h2>' +
                        '<p>' +
                        'Nom du groupe : ' + groupe.nom + '<br /><br />' +
                        'Adresse de contact du groupe : ' + groupe.email + '<br /><br />' +
                        'Lien d\'accès public au groupe : ' +
                        '<a href="' + Util.getAppUrl() + 'groupes/' + groupe.slug + '" rel="Accès à l\'application">' +
                        Util.getAppUrl() + 'groupes/' + groupe.slug +
                        '</a>' +
                        '<br /></p>' +
                        '<p>Partagez le lien de votre groupe avec vos amis et organisez vos repas ensemble !</p>' +
                        '<h4>Vivien de Qui Mange Où</h4>';

                    // envoie de l'email
                    let responsePromise = Email.send(groupe.email, titre, message);
                    responsePromise.then(
                        (value) => {
                            // envoie de la réponse à la requête
                            res.status(200)
                                .json({
                                    status: 200,
                                    data: {
                                        nomGroupe: groupe.nom,
                                        email: groupe.email
                                    },
                                    message: 'Les informations de votre groupe ont été envoyées sur votre adresse e-mail.'
                                });
                            return;
                        },
                        (reason) => {
                            res.status(500)
                                .json({
                                    status: 500,
                                    error: reason,
                                    message: "Erreur lors de l'envoie de l'e-mail de rappel des informations du groupe."
                                });
                            return;
                        }
                    );

                }

            } catch (error) {
                res.status(500)
                    .json({
                        status: 500,
                        error: error,
                        message: "Erreur technique lors de la création de votre groupe."
                    });
                return;
            }
        });

    // routes qui finissent par /validations/:token
    // ----------------------------------------------------
    router.route('/validations/:token')

        // Validation du token et création du Groupe
        .get((req, res) => {
            try {

                // recherche de la Validation en bdd
                Validation.findOne({
                    'token': req.params.token
                }, (err, validation) => {
                    if (err || !validation) {
                        res.status(500)
                            .json({
                                status: 500,
                                error: err,
                                message: "Erreur lors de la validation du lien."
                            });
                        return;
                    }

                    // vérification de la validité du token
                    let isTokenExpired = false;
                    let expirationDate = moment(validation.dateCreation).add(1, 'days');
                    if (moment().isAfter(expirationDate)) {
                        isTokenExpired = true;
                    }

                    // suppression de la Validation en bdd
                    Validation.remove({
                        'token': validation.token
                    }, (err) => {
                        if (err) {
                            res.status(500)
                                .json({
                                    status: 500,
                                    error: err,
                                    message: "Erreur lors de la suppression de la Validation."
                                });
                            return;
                        }
                    });

                    // si le token est expiré, on ne crée pas le Groupe
                    if (isTokenExpired) {
                        res.status(500)
                            .json({
                                status: 500,
                                error: null,
                                message: "Le lien de Validation a expiré, veuillez en créer un nouveau."
                            });
                        return;
                    }

                    // création du Groupe correspondant à la Validation
                    Groupe.create({
                            nom: validation.nomGroupe,
                            email: validation.email,
                            slug: Util.generateToken()
                        },
                        (err, groupe) => {
                            if (err) {
                                res.status(500)
                                    .json({
                                        status: 500,
                                        error: err,
                                        message: "Erreur lors de la création du groupe."
                                    });
                                return;
                            }

                            // envoie d'un e-mail contenant les informations du groupe créé
                            sendCreationGroupeEmailCallback(groupe);
                        });
                });

                function sendCreationGroupeEmailCallback(groupe) {
                    const titre = 'Votre groupe sur QuiMangeOù';
                    const message = '<p>' +
                        'Votre groupe a bien été créé, voici les informations le concernant :<br /><br />' +
                        'Nom du groupe : ' + groupe.nom + '<br /><br />' +
                        'Adresse de contact du groupe : ' + groupe.email + '<br /><br />' +
                        'Lien d\'accès public au groupe : ' +
                        '<a href="' + Util.getAppUrl() + 'groupes/' + groupe.slug + '" rel="Accès à l\'application">' +
                        Util.getAppUrl() + 'groupes/' + groupe.slug +
                        '</a>' +
                        '<br /></p>' +
                        '<p>Partagez le lien de votre groupe avec vos amis et organisez vos repas ensemble !</p>' +
                        '<h4>Vivien de Qui Mange Où</h4>';

                    // envoie de l'email
                    let responsePromise = Email.send(validation.email, titre, message);
                    responsePromise.then(
                        (value) => {
                            // envoie de la réponse à la requête
                            res.status(201)
                                .json({
                                    status: 201,
                                    data: groupe,
                                    message: 'Votre groupe a bien été créé.'
                                });
                            return;
                        },
                        (reason) => {
                            res.status(500)
                                .json({
                                    status: 500,
                                    error: reason,
                                    message: "Erreur lors de l'envoie de l'e-mail de création du groupe."
                                });
                            return;
                        }
                    );
                }

            } catch (error) {
                res.status(500)
                    .json({
                        status: 500,
                        error: error,
                        message: "Erreur technique lors de la validation de votre groupe."
                    });
                return;
            }
        });

};