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
})

const User = mongoose.model("users", userSchema)

module.exports = User