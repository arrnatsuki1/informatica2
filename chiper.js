const SHA256 = require('crypto-js/sha256')

module.exports = class Cipher {
    constructor(){}

    encrypt(string) {
        return SHA256(string).toString()
    }

}