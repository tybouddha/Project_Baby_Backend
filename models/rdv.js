const mongoose = require("mongoose");

const rdvSchema = mongoose.Schema({
  date: Date,
  pourQui: String,
  practicien: String,
  lieu: String,
  notes: String,
  heure: String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: "projects" },
});

const Rdv = mongoose.model("rdvs", rdvSchema);

module.exports = Rdv;
