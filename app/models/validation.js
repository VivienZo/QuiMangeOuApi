const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ValidationSchema = new Schema({
    email: String,
    token: String,
    nomGroupe: String,
    dateCreation: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Validation', ValidationSchema);