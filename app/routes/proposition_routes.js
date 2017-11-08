const Proposition = require('../models/proposition');
const Groupe = require('../models/groupe');
const moment = require('moment');

module.exports = (app, router) => {

    // routes qui finissent par /groupes/:slug/propositions
    // ----------------------------------------------------
    router.route('/groupes/:slug/propositions')

        // récupération de toutes les propositions d'un groupe pour une journée ou une plage de jours
        // GET http://localhost:8080/api/groupes/8e46c461efebfacbb4ff8d66a1e346707110262418442e7f/propositions/
        .get((req, res) => {
            try {

                let startDay, endDay;

                // si une date de début est indiquée, on récupère toutes les propositions depuis le jour indiqué (inclus)
                // .../propositions?startday=2017-01-01
                if (typeof req.query.startday === 'string' && moment(req.query.startday, "YYYY-MM-DD", true).isValid()) {
                    startDay = moment(req.query.startday).startOf('day');
                }
                // si une date de fin est indiquée, on récupère toutes les propositions jusqu'au jour indiqué (inclus)
                // .../propositions?endday=2017-01-01
                if (typeof req.query.endday === 'string' && moment(req.query.endday, "YYYY-MM-DD", true).isValid()) {
                    endDay = moment(req.query.endday).endOf('day');
                }

                // s'il n'y a qu'une date de début, on fixe la date de fin à 2099-12-31
                if (startDay && !endDay) {
                    endDay = moment('2099-12-31').endOf('day');
                }
                // s'il n'y a qu'une date de fin, on fixe la date de début à 1970-01-01
                if (!startDay && endDay) {
                    startDay = moment('1970-01-01').startOf('day');
                }

                // si un jour précis est indiqué dans l'URL, on récupère les propositions de ce jour (jour courant par défaut)
                // .../propositions?day=2017-06-14
                if (typeof req.query.day === 'string' && moment(req.query.day, "YYYY-MM-DD", true).isValid()) {
                    startDay = moment(req.query.day).startOf('day');
                    endDay = moment(req.query.day).endOf('day');
                }

                // si aucun jour n'est indiqué ou si les dates ne sont pas cohérentes, on récupère les propositions du jour actuel
                if (!startDay && !endDay || startDay && endDay && startDay.isAfter(endDay)) {
                    startDay = moment().startOf('day');
                    endDay = moment().endOf('day');
                }

                Proposition.find({
                        'groupeSlug': req.params.slug,
                        'date': {
                            $gte: startDay.toDate(),
                            $lte: endDay.toDate()
                        }
                    })
                    .sort({
                        date: 1
                    })
                    .exec((err, propositions) => {
                        if (err) {
                            res.status(500)
                                .json({
                                    status: 500,
                                    error: err,
                                    message: "Erreur lors de la récupération des propositions."
                                });
                            return;
                        }

                        // retourne la liste de Propositions trouvées
                        res.status(200)
                            .json({
                                status: 200,
                                data: propositions,
                                message: 'Propositions récupérées.'
                            });
                        return;
                    });
            } catch (error) {
                res.status(500)
                    .json({
                        status: 500,
                        error: error,
                        message: "Erreur technique lors de la recherche des propositions."
                    });
                return;
            }
        })

        // création d'une nouvelle proposition dans un groupe
        // POST http://localhost:8080/api/groupes/8e46c461efebfacbb4ff8d66a1e346707110262418442e7f/propositions/
        .post((req, res) => {
            try {

                // recherche si le groupe donné existe
                Groupe.findOne({
                        'slug': req.params.slug
                    })
                    .exec((err, groupe) => {
                        if (err || !groupe || !groupe._id) {
                            res.status(500)
                                .json({
                                    status: 500,
                                    error: err,
                                    message: "Erreur lors de la récupération du groupe."
                                });
                            return;
                        }

                        // vérification des données d'entrée
                        if (!req.body.resto || typeof req.body.resto !== "string" && req.body.resto.length < 50) {
                            res.status(500)
                                .json({
                                    status: 500,
                                    error: {
                                        resto: req.body.resto
                                    },
                                    message: "'resto' est invalide."
                                });
                            return;
                        }

                        // création de la proposition
                        Proposition.create({
                                groupeSlug: req.params.slug,
                                resto: req.body.resto,
                                date: req.body.date,
                                participants: [],
                                nonParticipants: [],
                                potentielsParticipants: []
                            },
                            (err, proposition) => {
                                if (err) {
                                    res.status(500)
                                        .json({
                                            status: 500,
                                            error: err,
                                            message: "Erreur lors de la création de la proposition."
                                        });
                                    return;
                                }

                                // renvoie la proposition créée
                                res.status(201)
                                    .json({
                                        status: 201,
                                        data: proposition,
                                        message: 'Proposition créée.'
                                    });
                                return;
                            });

                    });
            } catch (error) {
                res.status(500)
                    .json({
                        status: 500,
                        error: error,
                        message: "Erreur technique lors de la création de la proposition."
                    });
                return;
            }

        });

    // routes qui finissent par /groupes/:slug/propositions/:proposition_id
    // ----------------------------------------------------
    router.route('/groupes/:slug/propositions/:proposition_id')

        // récupération d'une proposition d'un groupe
        // GET http://localhost:8080/api/groupes/8e46c461efebfacbb4ff8d66a1e346707110262418442e7f/propositions/58b56d3ed0141d047867e594
        .get((req, res) => {
            try {

                Proposition.findById(req.params.proposition_id)
                    .exec((err, proposition) => {

                        // erreur si la proposition n'existe pas ou que le groupe donné ne correspond pas au groupe de la proposition
                        if (err || !proposition || proposition.groupeSlug !== req.params.slug) {
                            res.status(500)
                                .json({
                                    status: 500,
                                    error: err,
                                    message: "Erreur lors de la récupération de la proposition."
                                });
                            return;
                        }

                        // renvoie la proposition
                        res.status(200)
                            .json({
                                status: 200,
                                data: proposition,
                                message: 'Proposition récupérée.'
                            });
                        return;
                    });

            } catch (error) {
                res.status(500)
                    .json({
                        status: 500,
                        error: error,
                        message: "Erreur technique lors de la récupération de la proposition."
                    });
                return;
            }
        })

        // mise à jour d'une proposition d'un groupe
        // PATCH http://localhost:8080/api/groupes/8e46c461efebfacbb4ff8d66a1e346707110262418442e7f/propositions/58b56d3ed0141d047867e594
        .patch((req, res) => {
            try {

                // on récupère la proposition
                Proposition.findOne({
                        '_id': req.params.proposition_id,
                        'groupeSlug': req.params.slug
                    })
                    .exec((err, proposition) => {
                        if (err || !proposition) {
                            res.status(500)
                                .json({
                                    status: 500,
                                    error: err,
                                    message: "Erreur lors de la récupération de la proposition."
                                });
                            return;
                        }

                        // MàJ du nom du resto
                        if (req.body.resto && typeof req.body.resto === "string" && req.body.resto.length < 50) {
                            proposition.resto = req.body.resto;
                        }

                        // MàJ de la date de l'évènement
                        if (req.body.date && typeof req.body.date === "string" && moment(req.body.date, ["YYYY-MM-DD", "YYYY-MM-DD HH:mm"], true).isValid()) {
                            proposition.date = req.body.date;
                        }

                        // MàJ des participants
                        if (req.body.participant && typeof req.body.participant === "string" && req.body.participant.length < 50) {
                            proposition.participants.addToSet(req.body.participant);
                        }
                        if (req.body.participants && Array.isArray(req.body.participants)) {
                            req.body.participants.forEach((participant) => {
                                if (typeof participant === "string" && participant.length < 50) {
                                    proposition.participants.addToSet(participant);
                                }
                            });
                        }
                        if (req.body.participantASupprimer && typeof req.body.participantASupprimer === "string" && req.body.participantASupprimer.length < 50) {
                            proposition.participants.pull(req.body.participantASupprimer);
                        }

                        // MàJ des non participants
                        if (req.body.nonParticipant && typeof req.body.nonParticipant === "string" && req.body.nonParticipant.length < 50) {
                            proposition.nonParticipants.addToSet(req.body.nonParticipant);
                        }
                        if (req.body.nonParticipants && Array.isArray(req.body.nonParticipants)) {
                            req.body.nonParticipants.forEach((nonParticipant) => {
                                if (typeof nonParticipant === "string" && nonParticipant.length < 50) {
                                    proposition.nonParticipants.addToSet(nonParticipant);
                                }
                            });
                        }
                        if (req.body.nonParticipantASupprimer && typeof req.body.nonParticipantASupprimer === "string" && req.body.nonParticipantASupprimer.length < 50) {
                            proposition.nonParticipants.pull(req.body.nonParticipantASupprimer);
                        }

                        // MàJ des potentiels participants
                        if (req.body.potentielParticipant && typeof req.body.potentielParticipant === "string" && req.body.potentielParticipant.length < 50) {
                            proposition.potentielsParticipants.addToSet(req.body.potentielParticipant);
                        }
                        if (req.body.potentielsParticipants && Array.isArray(req.body.potentielsParticipants)) {
                            req.body.potentielsParticipants.forEach((potentielParticipant) => {
                                if (typeof potentielParticipant === "string" && potentielParticipant.length < 50) {
                                    proposition.potentielsParticipants.addToSet(potentielParticipant);
                                }
                            });
                        }
                        if (req.body.potentielParticipantASupprimer && typeof req.body.potentielParticipantASupprimer === "string" && req.body.potentielParticipantASupprimer.length < 50) {
                            proposition.potentielsParticipants.pull(req.body.potentielParticipantASupprimer);
                        }

                        // enregistrement de la nouvelle version de la proposition
                        proposition.save((err) => {
                            if (err) {
                                res.status(500)
                                    .json({
                                        status: 500,
                                        error: err,
                                        message: "Erreur lors de la mise à jour de la proposition."
                                    });
                                return;
                            }

                            // renvoie la proposition à jour
                            res.status(200)
                                .json({
                                    status: 200,
                                    data: proposition,
                                    message: 'Proposition récupérée.'
                                });
                            return;
                        });
                    });

            } catch (error) {
                res.status(500)
                    .json({
                        status: 500,
                        error: error,
                        message: "Erreur technique lors de la mise à jour de la proposition."
                    });
                return;
            }
        })

        // suppression d'une proposition d'un groupe
        // DELETE http://localhost:8080/api/groupes/8e46c461efebfacbb4ff8d66a1e346707110262418442e7f/propositions/58b56d3ed0141d047867e594
        .delete((req, res) => {
            try {

                // recherche de la proposition à supprimer
                Proposition.findById(req.params.proposition_id)
                    .exec((err, proposition) => {

                        // erreur si la proposition n'existe pas ou que le groupe donné ne correspond pas au groupe de la proposition
                        if (err || !proposition || proposition.groupeSlug !== req.params.slug) {
                            res.status(500)
                                .json({
                                    status: 500,
                                    error: err,
                                    message: "Erreur lors de la récupération de la proposition."
                                });
                            return;
                        }

                        // suppression de la proposition
                        proposition.remove((err, removedProp) => {
                            if (err) {
                                res.status(500)
                                    .json({
                                        status: 500,
                                        error: err,
                                        message: "Erreur lors de la suppression de la proposition."
                                    });
                                return;
                            }

                            // renvoie la proposition qui a été supprimée
                            res.status(200)
                                .json({
                                    status: 200,
                                    data: removedProp,
                                    message: "Proposition supprimée."
                                });
                            return;
                        });
                    });

            } catch (error) {
                res.status(500)
                    .json({
                        status: 500,
                        error: error,
                        message: "Erreur technique lors de la suppression de la proposition."
                    });
                return;
            }
        });

};