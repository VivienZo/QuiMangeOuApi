const globalMiddleware = require('./global_middleware');

module.exports = function(app, router) {
    globalMiddleware(app, router);
    // Les autres middlewares iront ici
};