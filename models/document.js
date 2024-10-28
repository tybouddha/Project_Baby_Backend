const mongoose = require("mongoose");



const documentSchema = mongoose.Schema({
    url: String,
    nom: String,
    practicien: String,
    notes: String,
    dateAjoute: Date,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'projects' },
})

const Document = mongoose.model("documents", userSchema)

module.exports = Document