// call the packages we need
const express = require('express');
const app = express();
const router = express.Router(); // create our router
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const db = require('./config/db');

const port = process.env.PORT || 8080; // set our port
const apiVersion = 'v1';

// sert des fichiers statiques
app.use(express.static('public'));

// configuration du logger
app.use(morgan('dev')); // log les requêtes dans la console

// parse le body des requêtes en JSON
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// import des middlewares de l'app
require('./app/middlewares')(app, router);

// import des routes de l'app
require('./app/routes')(app, router);

// prefixe toutes les routes exposées par l'api avec "/api/v1"
app.use('/api/' + apiVersion, router);

// connexion à la base de données MongoDB
mongoose.Promise = require('bluebird');
mongoose.connect(db.url, {
    useMongoClient: true,
    socketTimeoutMS: 0,
    keepAlive: true,
    reconnectTries: 30
});
let connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'Connection error: '));
connection.once('open', () => {
    // lancement de l'application
    app.listen(port);
    console.log('Server listen on port ' + port);
});