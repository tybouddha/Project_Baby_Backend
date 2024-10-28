const mongoose = require("mongoose");



const carnetBebeSchema = mongoose.Schema({
    date: Date,
    heureDodo: Date,
    quantiteMiam: String,
    selle: String,
    couleurSelle: String,
    poids: Number,
    taille: Number, //cm
    notes: String,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'projects' },
})

const CarnetBebe = mongoose.model("carnetBebes", userSchema)

module.exports = CarnetBebe