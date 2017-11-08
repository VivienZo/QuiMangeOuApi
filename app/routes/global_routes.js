module.exports = function(app, router) {

    // GET http://localhost:8080/api/v1
    router.get('/', function(req, res) {
        // redirection vers la documentation de l'API
        res.redirect('../../');
    });

};