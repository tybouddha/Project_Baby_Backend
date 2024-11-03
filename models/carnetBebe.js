const mongoose = require("mongoose");

const carnetBebeSchema = mongoose.Schema({
  date: Date,
  heureCoucher: String,
  repas: String,
  selle: String,
  couleurSelle: String,
  poids: Number,
  taille: Number, //cm
  notes: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: "projects" },
});

const CarnetBebe = mongoose.model("carnetBebes", carnetBebeSchema);

module.exports = CarnetBebe;
