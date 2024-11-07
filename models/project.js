const mongoose = require("mongoose");

const projectSchema = mongoose.Schema({
  proprietaire: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  editeur: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  lecteur: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  carnetBebe: [{ type: mongoose.Schema.Types.ObjectId, ref: "carnetBebes" }],
  rdv: [{ type: mongoose.Schema.Types.ObjectId, ref: "rdvs" }],
  document: [{ type: mongoose.Schema.Types.ObjectId, ref: "documents" }],
  token: String,
});

const Project = mongoose.model("projects", projectSchema);

module.exports = Project;
