const Groupe = require('../models/groupe');

module.exports = (app, router) => {

    // routes qui finissent par /groupes/:slug
    // ----------------------------------------------------
    router.route('/groupes/:slug')

        // informations générales du groupe
        .get((req, res) => {
            try {

                // récupération des informations du groupe
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

                        // renvoie le groupe
                        res.status(200)
                            .json({
                                status: 200,
                                data: groupe,
                                message: 'Le groupe a été récupéré.'
                            });
                        return;
                    });

            } catch (error) {
                res.status(500)
                    .json({
                        status: 500,
                        error: error,
                        message: "Erreur technique lors de la récupération des informations générales du groupe."
                    });
                return;
            }
        })

        // modification du nom du groupe
        .patch((req, res) => {
            try {

                Groupe.findOne({
                        'slug': req.params.slug
                    })
                    .exec((err, groupe) => {
                        if (err || !groupe) {
                            res.status(500)
                                .json({
                                    status: 500,
                                    error: err,
                                    message: "Erreur lors de la récupération du groupe."
                                });
                            return;
                        }

                        // mise à jour du nom du groupe
                        if (req.body.nom && typeof req.body.nom === "string" && req.body.nom.length < 50) {
                            groupe.nom = req.body.nom;
                            groupe.save((err) => {
                                if (err) {
                                    res.status(500)
                                        .json({
                                            status: 500,
                                            error: err,
                                            message: "Erreur lors de la mise à jour du groupe."
                                        });
                                    return;
                                }

                                // renvoie le groupe à jour
                                res.status(200)
                                    .json({
                                        status: 200,
                                        data: groupe,
                                        message: 'Le nom du groupe a bien été mis à jour.'
                                    });
                                return;
                            });
                        }
                    });

            } catch (error) {
                res.status(500)
                    .json({
                        status: 500,
                        error: error,
                        message: "Erreur technique lors de la mise à jour du groupe."
                    });
                return;
            }
        })

};