const mongoose = require("mongoose");



const enfantSchema = mongoose.Schema({
    prenom: String,
    dnn: Date,
    username: String,
    poids: Number,
    taille: Number, //cm
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'projects' },
})

const Enfant = mongoose.model("enfants", userSchema)

module.exports = Enfant