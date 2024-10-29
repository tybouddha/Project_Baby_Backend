const mongoose = require("mongoose");



const userSchema = mongoose.Schema({
    prenom: String,
    nomDeFamille: String,
    username: String,
    derniereMenstruation: Date || Boolean,
    dateDebutGrossesse: Date || Boolean,
    email: String,
    password: String,
    token: String,
    proprietaire: Boolean,
    role: { type: String, enum: ['lecteur', 'editeur'], default: 'lecteur' }
})

const User = mongoose.model("users", userSchema)

module.exports = User