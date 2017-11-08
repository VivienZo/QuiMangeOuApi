const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupeSchema = new Schema({
    slug: String,
    nom: String,
    email: String
});

module.exports = mongoose.model('Groupe', GroupeSchema);