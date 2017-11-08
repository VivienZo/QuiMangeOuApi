module.exports = function(app, router) {

    // middleware global
    router.use(function(req, res, next) {
        // traitement à faire sur toutes les requêtes entrantes
        next();
    });

};