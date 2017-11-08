const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PropositionSchema = new Schema({
    resto: String,
    participants: [String],
    nonParticipants: [String],
    potentielsParticipants: [String],
    date: {
        type: Date,
        default: Date.now
    },
    groupeSlug: String
});

module.exports = mongoose.model('Proposition', PropositionSchema);