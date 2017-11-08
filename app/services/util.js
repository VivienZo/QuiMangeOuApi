const crypto = require('crypto');

module.exports = {
    generateToken: generateToken,
    getApiUrl: getApiUrl,
    getAppUrl: getAppUrl
};

function generateToken() {
    return encodeURIComponent(crypto.randomBytes(24).toString('hex'));
}

function getApiUrl() {
    return "https://quimangeou-api.herokuapp.com/api/v1/";
}

function getAppUrl() {
    return "https://www.quimangeou.fr/";
}