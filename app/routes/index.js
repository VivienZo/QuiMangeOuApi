const globalRoutes = require('./global_routes');
const validationRoutes = require('./validation_routes');
const groupeRoutes = require('./groupe_routes');
const propositionRoutes = require('./proposition_routes');

module.exports = function(app, router) {
    globalRoutes(app, router);
    validationRoutes(app, router);
    groupeRoutes(app, router);
    propositionRoutes(app, router);
};